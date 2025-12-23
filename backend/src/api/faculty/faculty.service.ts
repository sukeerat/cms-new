import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { LruCacheService } from '../../core/cache/lru-cache.service';
import { Prisma, ApplicationStatus, MonthlyReportStatus } from '@prisma/client';

@Injectable()
export class FacultyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: LruCacheService,
  ) {}

  /**
   * Get faculty profile
   */
  async getProfile(facultyId: string) {
    const faculty = await this.prisma.user.findUnique({
      where: { id: facultyId },
      include: {
        Institution: true,
      },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    return faculty;
  }

  /**
   * Get student detail
   */
  async getStudentDetail(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        batch: true,
        branch: true,
        Institution: true,
        internshipApplications: {
          include: {
            internship: {
              include: {
                industry: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * Get faculty dashboard data with assigned students count and pending reviews
   */
  async getDashboard(facultyId: string) {
    const cacheKey = `faculty:dashboard:${facultyId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // First, get all student IDs assigned to this faculty
        const assignedStudentIds = await this.prisma.mentorAssignment.findMany({
          where: {
            mentorId: facultyId,
            isActive: true,
          },
          select: { studentId: true },
        });
        const studentIds = assignedStudentIds.map((a) => a.studentId);

        // Only count self-identified internships (not placement-based)
        const [
          assignedStudents,
          activeSelfIdentifiedInternships,
          pendingReports,
          pendingVisits,
          totalVisits,
        ] = await Promise.all([
          // Count assigned students
          Promise.resolve(studentIds.length),
          // Count active self-identified internships for assigned students
          this.prisma.internshipApplication.count({
            where: {
              studentId: { in: studentIds },
              OR: [
                { isSelfIdentified: true },
                { internshipId: null },
              ],
              status: { in: [ApplicationStatus.APPROVED, ApplicationStatus.JOINED] },
            },
          }),
          // Count pending monthly reports for assigned students
          this.prisma.monthlyReport.count({
            where: {
              application: {
                studentId: { in: studentIds },
                OR: [
                  { isSelfIdentified: true },
                  { internshipId: null },
                ],
              },
              status: MonthlyReportStatus.SUBMITTED,
            },
          }),
          // Count pending applications (if any) for assigned students
          this.prisma.internshipApplication.count({
            where: {
              studentId: { in: studentIds },
              OR: [
                { isSelfIdentified: true },
                { internshipId: null },
              ],
              status: ApplicationStatus.APPLIED,
            },
          }),
          this.prisma.facultyVisitLog.count({
            where: {
              facultyId,
            },
          }),
        ]);

        // Get recent activities
        const recentVisits = await this.prisma.facultyVisitLog.findMany({
          where: { facultyId },
          take: 5,
          orderBy: { visitDate: 'desc' },
          include: {
            application: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    rollNumber: true,
                  },
                },
              },
            },
          },
        });

        const upcomingVisits = await this.prisma.facultyVisitLog.findMany({
          where: {
            facultyId,
            visitDate: {
              gte: new Date(),
            },
          },
          take: 5,
          orderBy: { visitDate: 'asc' },
          include: {
            application: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    rollNumber: true,
                  },
                },
              },
            },
          },
        });

        return {
          totalStudents: assignedStudents,
          // Self-identified internships only (no placement-based)
          activeInternships: activeSelfIdentifiedInternships,
          pendingReports,
          pendingApprovals: pendingVisits,
          totalVisits,
          recentActivities: recentVisits,
          upcomingVisits,
        };
      },
      { ttl: 300, tags: ['faculty', `faculty:${facultyId}`] },
    );
  }

  /**
   * Get assigned students list with pagination
   */
  async getAssignedStudents(
    facultyId: string,
    params: { page?: number; limit?: number; search?: string },
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const search = params.search;
    const skip = (page - 1) * limit;

    const where: Prisma.MentorAssignmentWhereInput = {
      mentorId: facultyId,
      isActive: true,
    };

    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [assignments, total] = await Promise.all([
      this.prisma.mentorAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              batch: true,
              branch: true,
              internshipApplications: {
                where: {
                  OR: [
                    { isSelfIdentified: true },
                    { internshipId: null }, // No linked internship = self-identified
                  ],
                },
                include: {
                  internship: {
                    include: {
                      industry: true,
                    },
                  },
                  monthlyReports: {
                    orderBy: { createdAt: 'desc' as const },
                    take: 5,
                  },
                  facultyVisitLogs: {
                    orderBy: { visitDate: 'desc' as const },
                    take: 5,
                  },
                },
                orderBy: { createdAt: 'desc' as const },
              },
              _count: {
                select: {
                  monthlyReports: true,
                },
              },
            },
          },
        },
        orderBy: { assignmentDate: 'desc' },
      }),
      this.prisma.mentorAssignment.count({ where }),
    ]);

    return {
      students: assignments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get student progress details (self-identified internships only)
   */
  async getStudentProgress(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        internshipApplications: {
          where: {
            OR: [
              { isSelfIdentified: true },
              { internshipId: null }, // No linked internship = self-identified
            ],
          },
          include: {
            internship: {
              include: {
                industry: true,
              },
            },
            monthlyReports: {
              orderBy: { reportMonth: 'asc' },
            },
            monthlyFeedbacks: {
              orderBy: { feedbackMonth: 'asc' },
            },
            facultyVisitLogs: {
              orderBy: { visitDate: 'desc' },
            },
            completionFeedback: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Calculate overall progress (self-identified internships only)
    const currentApplication = student.internshipApplications.find(
      app => app.isSelfIdentified && (app.status === ApplicationStatus.JOINED || app.status === ApplicationStatus.APPROVED)
    );

    let overallProgress = 0;
    let completionStatus = 'NOT_STARTED';

    if (currentApplication) {
      const totalReportsExpected = 6; // Assuming 6 months internship
      const submittedReports = currentApplication.monthlyReports.filter(
        r => r.status === MonthlyReportStatus.APPROVED || r.status === MonthlyReportStatus.SUBMITTED
      ).length;

      overallProgress = (submittedReports / totalReportsExpected) * 100;

      if (currentApplication.status === ApplicationStatus.COMPLETED) {
        completionStatus = 'COMPLETED';
      } else if (submittedReports > 0) {
        completionStatus = 'IN_PROGRESS';
      } else {
        completionStatus = 'STARTED';
      }
    }

    return {
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      overallProgress: Math.round(overallProgress),
      currentInternship: currentApplication,
      monthlyReports: currentApplication?.monthlyReports || [],
      visitLogs: currentApplication?.facultyVisitLogs || [],
      feedback: currentApplication?.monthlyFeedbacks || [],
      completionStatus,
    };
  }

  /**
   * Get visit logs with pagination
   */
  async getVisitLogs(
    facultyId: string,
    params: { page?: number; limit?: number; studentId?: string },
  ) {
    const { studentId } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FacultyVisitLogWhereInput = {
      facultyId,
    };

    if (studentId) {
      where.application = {
        studentId,
      };
    }

    const [visitLogs, total] = await Promise.all([
      this.prisma.facultyVisitLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          application: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  rollNumber: true,
                },
              },
              internship: {
                include: {
                  industry: {
                    select: {
                      id: true,
                      companyName: true,
                      city: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { visitDate: 'desc' },
      }),
      this.prisma.facultyVisitLog.count({ where }),
    ]);

    return {
      visitLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create visit log (supports quick visit logging)
   * Required fields: applicationId OR studentId, visitType, visitLocation
   * All other fields are optional
   */
  async createVisitLog(facultyId: string, createVisitLogDto: any) {
    const {
      applicationId,
      studentId,
      visitDate,
      visitType,
      visitLocation,
      latitude,
      longitude,
      visitPhotos,
      status,
      ...visitData
    } = createVisitLogDto;

    // Validate required fields
    if (!visitType) {
      throw new BadRequestException('visitType is required');
    }

    if (!visitLocation) {
      throw new BadRequestException('visitLocation is required');
    }

    // Find application - support both applicationId and studentId
    let application;

    if (applicationId) {
      // Direct application ID provided
      application = await this.prisma.internshipApplication.findFirst({
        where: {
          id: applicationId,
          mentorId: facultyId,
        },
      });
    } else if (studentId) {
      // Find active application by student ID
      application = await this.prisma.internshipApplication.findFirst({
        where: {
          studentId,
          mentorId: facultyId,
          status: { in: ['JOINED', 'APPROVED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      throw new BadRequestException('Either applicationId or studentId is required');
    }

    if (!application) {
      throw new NotFoundException('Application not found or you are not the assigned mentor');
    }

    // Count existing visits for this application
    const visitCount = await this.prisma.facultyVisitLog.count({
      where: { applicationId: application.id },
    });

    // Prepare visit data with defaults for quick logging
    const visitLogData: any = {
      applicationId: application.id,
      facultyId,
      internshipId: application.internshipId,
      visitNumber: visitCount + 1,
      visitType,
      visitLocation,
      // Auto-set visitDate to current date/time if not provided
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      // Auto-set status to COMPLETED for quick logs if not provided
      status: status || 'COMPLETED',
      // Include GPS coordinates if provided
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      // Include photo URLs if provided
      ...(visitPhotos && visitPhotos.length > 0 && { visitPhotos }),
      // Include any additional optional fields provided
      ...visitData,
    };

    const visitLog = await this.prisma.facultyVisitLog.create({
      data: visitLogData,
      include: {
        application: {
          include: {
            student: true,
            internship: {
              include: {
                industry: true,
              },
            },
          },
        },
      },
    });

    await this.cache.invalidateByTags(['visits', `application:${application.id}`, `faculty:${facultyId}`]);

    return visitLog;
  }

  /**
   * Update visit log
   */
  async updateVisitLog(id: string, updateVisitLogDto: any) {
    const visitLog = await this.prisma.facultyVisitLog.findUnique({
      where: { id },
    });

    if (!visitLog) {
      throw new NotFoundException('Visit log not found');
    }

    const updated = await this.prisma.facultyVisitLog.update({
      where: { id },
      data: updateVisitLogDto,
      include: {
        application: {
          include: {
            student: true,
          },
        },
      },
    });

    await this.cache.invalidateByTags(['visits', `visit:${id}`]);

    return updated;
  }

  /**
   * Delete visit log
   */
  async deleteVisitLog(id: string) {
    const visitLog = await this.prisma.facultyVisitLog.findUnique({
      where: { id },
    });

    if (!visitLog) {
      throw new NotFoundException('Visit log not found');
    }

    await this.prisma.facultyVisitLog.delete({
      where: { id },
    });

    await this.cache.invalidateByTags(['visits', `visit:${id}`]);

    return {
      success: true,
      message: 'Visit log deleted successfully',
    };
  }

  /**
   * Get monthly reports for review
   */
  async getMonthlyReports(
    facultyId: string,
    params: { page?: number; limit?: number; status?: string },
  ) {
    const { status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MonthlyReportWhereInput = {
      application: {
        mentorId: facultyId,
      },
    };

    if (status) {
      where.status = status as MonthlyReportStatus;
    }

    const [reports, total] = await Promise.all([
      this.prisma.monthlyReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          application: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  rollNumber: true,
                },
              },
              internship: {
                include: {
                  industry: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.monthlyReport.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Review monthly report
   */
  async reviewMonthlyReport(id: string, reviewDto: {
    facultyId: string;
    reviewComments?: string;
    isApproved: boolean;
  }) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Monthly report not found');
    }

    // Verify faculty is the mentor
    if (report.application.mentorId !== reviewDto.facultyId) {
      throw new BadRequestException('You are not authorized to review this report');
    }

    const updated = await this.prisma.monthlyReport.update({
      where: { id },
      data: {
        reviewedBy: reviewDto.facultyId,
        reviewedAt: new Date(),
        reviewComments: reviewDto.reviewComments,
        isApproved: reviewDto.isApproved,
        status: reviewDto.isApproved
          ? MonthlyReportStatus.APPROVED
          : MonthlyReportStatus.REJECTED,
      },
      include: {
        application: {
          include: {
            student: true,
          },
        },
      },
    });

    await this.cache.invalidateByTags(['reports', `report:${id}`]);

    return updated;
  }

  /**
   * Get self-identified internship approvals pending review
   */
  async getSelfIdentifiedApprovals(
    facultyId: string,
    params: { page?: number; limit?: number; status?: string },
  ) {
    const { status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InternshipApplicationWhereInput = {
      mentorId: facultyId,
      isSelfIdentified: true,
    };

    if (status) {
      where.status = status as ApplicationStatus;
    } else {
      where.status = ApplicationStatus.APPLIED; // Default to pending
    }

    const [approvals, total] = await Promise.all([
      this.prisma.internshipApplication.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              email: true,
              contact: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.internshipApplication.count({ where }),
    ]);

    return {
      approvals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update self-identified internship approval status
   */
  async updateSelfIdentifiedApproval(id: string, approvalDto: {
    facultyId: string;
    status: 'APPROVED' | 'REJECTED';
    reviewRemarks?: string;
  }) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!application.isSelfIdentified) {
      throw new BadRequestException('This is not a self-identified internship');
    }

    // Verify faculty is the mentor
    if (application.mentorId !== approvalDto.facultyId) {
      throw new BadRequestException('You are not authorized to approve this application');
    }

    const newStatus = approvalDto.status === 'APPROVED'
      ? ApplicationStatus.APPROVED
      : ApplicationStatus.REJECTED;

    const updated = await this.prisma.internshipApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: approvalDto.facultyId,
        reviewedAt: new Date(),
        reviewRemarks: approvalDto.reviewRemarks,
        ...(approvalDto.status === 'REJECTED' && {
          rejectionReason: approvalDto.reviewRemarks,
        }),
      },
      include: {
        student: true,
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return updated;
  }

  /**
   * Submit monthly feedback for student (from faculty perspective)
   */
  async submitMonthlyFeedback(facultyId: string, feedbackDto: any) {
    const { applicationId, ...feedbackData } = feedbackDto;

    // Verify application and mentor relationship
    const application = await this.prisma.internshipApplication.findFirst({
      where: {
        id: applicationId,
        mentorId: facultyId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found or you are not the assigned mentor');
    }

    // Note: Monthly feedback is typically submitted by industry, but faculty can add observations
    // This could be an internal note or observation

    const feedback = await this.prisma.monthlyFeedback.create({
      data: {
        applicationId,
        studentId: application.studentId,
        internshipId: application.internshipId,
        submittedBy: facultyId,
        ...feedbackData,
      },
    });

    await this.cache.invalidateByTags(['feedback', `application:${applicationId}`]);

    return feedback;
  }

  /**
   * Get feedback history
   */
  async getFeedbackHistory(
    facultyId: string,
    params: { page?: number; limit?: number; studentId?: string },
  ) {
    const { studentId } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MonthlyFeedbackWhereInput = {
      application: {
        mentorId: facultyId,
      },
    };

    if (studentId) {
      where.studentId = studentId;
    }

    const [feedback, total] = await Promise.all([
      this.prisma.monthlyFeedback.findMany({
        where,
        skip,
        take: limit,
        include: {
          application: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  rollNumber: true,
                },
              },
              internship: {
                include: {
                  industry: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { feedbackMonth: 'desc' },
      }),
      this.prisma.monthlyFeedback.count({ where }),
    ]);

    return {
      feedback,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Internship Management ====================

  /**
   * Get student internships
   */
  async getStudentInternships(studentId: string) {
    const internships = await this.prisma.internshipApplication.findMany({
      where: { studentId },
      include: {
        internship: {
          include: {
            industry: {
              select: {
                id: true,
                companyName: true,
                address: true,
              },
            },
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { internships };
  }

  /**
   * Update internship application
   */
  async updateInternship(id: string, updateDto: any, facultyId: string) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Internship application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to update this application');
    }

    const updated = await this.prisma.internshipApplication.update({
      where: { id },
      data: {
        status: updateDto.status,
        hasJoined: updateDto.hasJoined,
        isSelected: updateDto.isSelected,
        reviewRemarks: updateDto.remarks,
        joiningDate: updateDto.joiningDate ? new Date(updateDto.joiningDate) : undefined,
        reviewedAt: new Date(),
        reviewedBy: facultyId,
      },
      include: {
        student: true,
        internship: {
          include: {
            industry: true,
          },
        },
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return {
      success: true,
      message: 'Internship updated successfully',
      data: updated,
    };
  }

  /**
   * Delete internship application
   */
  async deleteInternship(id: string, facultyId: string) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Internship application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to delete this application');
    }

    await this.prisma.internshipApplication.delete({
      where: { id },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return {
      success: true,
      message: 'Internship application deleted successfully',
    };
  }

  // ==================== Monthly Report Actions ====================

  /**
   * Approve monthly report
   */
  async approveMonthlyReport(id: string, remarks: string, facultyId: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Monthly report not found');
    }

    // Verify faculty is the mentor
    if (report.application?.mentorId && report.application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to approve this report');
    }

    const updated = await this.prisma.monthlyReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: facultyId,
        reviewedAt: new Date(),
        reviewedBy: facultyId,
        reviewComments: remarks,
      },
    });

    await this.cache.invalidateByTags(['reports', `report:${id}`]);

    return {
      success: true,
      message: 'Monthly report approved successfully',
      data: updated,
    };
  }

  /**
   * Reject monthly report
   */
  async rejectMonthlyReport(id: string, reason: string, facultyId: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Monthly report not found');
    }

    // Verify faculty is the mentor
    if (report.application?.mentorId && report.application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to reject this report');
    }

    const updated = await this.prisma.monthlyReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        isApproved: false,
        reviewedAt: new Date(),
        reviewedBy: facultyId,
        reviewComments: reason,
      },
    });

    await this.cache.invalidateByTags(['reports', `report:${id}`]);

    return {
      success: true,
      message: 'Monthly report rejected',
      data: updated,
    };
  }

  /**
   * Delete monthly report
   */
  async deleteMonthlyReport(id: string, facultyId: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Monthly report not found');
    }

    // Verify faculty is the mentor
    if (report.application?.mentorId && report.application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to delete this report');
    }

    await this.prisma.monthlyReport.delete({
      where: { id },
    });

    await this.cache.invalidateByTags(['reports', `report:${id}`]);

    return {
      success: true,
      message: 'Monthly report deleted successfully',
    };
  }

  // ==================== Joining Letter Management ====================

  /**
   * Get joining letters for review
   */
  async getJoiningLetters(
    facultyId: string,
    params: { page?: number; limit?: number; status?: string },
  ) {
    const { status } = params;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InternshipApplicationWhereInput = {
      mentorId: facultyId,
      joiningLetterUrl: { not: null },
    };

    if (status) {
      where.status = status as any;
    }

    const [letters, total] = await Promise.all([
      this.prisma.internshipApplication.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          joiningLetterUrl: true,
          joiningLetterUploadedAt: true,
          status: true,
          reviewedAt: true,
          reviewedBy: true,
          reviewRemarks: true,
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              email: true,
            },
          },
          internship: {
            include: {
              industry: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
        },
        orderBy: { joiningLetterUploadedAt: 'desc' },
      }),
      this.prisma.internshipApplication.count({ where }),
    ]);

    return {
      letters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Verify joining letter
   */
  async verifyJoiningLetter(id: string, remarks: string, facultyId: string) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to verify this joining letter');
    }

    const updated = await this.prisma.internshipApplication.update({
      where: { id },
      data: {
        reviewedBy: facultyId,
        reviewedAt: new Date(),
        reviewRemarks: remarks,
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return {
      success: true,
      message: 'Joining letter verified successfully',
      data: updated,
    };
  }

  /**
   * Reject joining letter
   */
  async rejectJoiningLetter(id: string, reason: string, facultyId: string) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to reject this joining letter');
    }

    const updated = await this.prisma.internshipApplication.update({
      where: { id },
      data: {
        reviewedBy: facultyId,
        reviewedAt: new Date(),
        reviewRemarks: reason,
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return {
      success: true,
      message: 'Joining letter rejected',
      data: updated,
    };
  }

  /**
   * Delete joining letter
   */
  async deleteJoiningLetter(id: string, facultyId: string) {
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to delete this joining letter');
    }

    const updated = await this.prisma.internshipApplication.update({
      where: { id },
      data: {
        joiningLetterUrl: null,
        joiningLetterUploadedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        reviewRemarks: null,
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${id}`]);

    return {
      success: true,
      message: 'Joining letter deleted successfully',
      data: updated,
    };
  }

  /**
   * Upload joining letter for a student
   */
  async uploadJoiningLetter(applicationId: string, joiningLetterUrl: string, facultyId: string) {
    // Verify application exists and faculty is the mentor
    const application = await this.prisma.internshipApplication.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify faculty is the mentor
    if (application.mentorId && application.mentorId !== facultyId) {
      throw new BadRequestException('You are not authorized to upload a joining letter for this application');
    }

    // Update the application with joining letter URL and clear previous review data
    const updated = await this.prisma.internshipApplication.update({
      where: { id: applicationId },
      data: {
        joiningLetterUrl,
        joiningLetterUploadedAt: new Date(),
        reviewedBy: null,
        reviewedAt: null,
        reviewRemarks: null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
          },
        },
        internship: {
          include: {
            industry: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
      },
    });

    await this.cache.invalidateByTags(['applications', `application:${applicationId}`]);

    return {
      success: true,
      message: 'Joining letter uploaded successfully',
      data: updated,
    };
  }
}
