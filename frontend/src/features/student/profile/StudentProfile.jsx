import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../../services/api";
import { getImageUrl } from "../../../utils/imageUtils";
import {
  Card,
  Col,
  Row,
  Typography,
  Spin,
  Avatar,
  Tag,
  Progress,
  Tabs,
  Statistic,
  Table,
  Button,
  Empty,
  Form,
  Input,
  Select,
  Upload,
  Modal,
} from "antd";
import ImgCrop from "antd-img-crop";
import {
  UserOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined,
  BookOutlined,
  TrophyOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  EditOutlined,
  TeamOutlined,
  UploadOutlined,
  BulbOutlined,
  LaptopOutlined,
  BankOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  CameraOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function StudentProfile() {
  //const {id} = useParams();
  const [id, setId] = useState(null);
  const [student, setStudent] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const rawResults = student?.results || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [uploadModal, setUploadModal] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [profileImageList, setProfileImageList] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const toastShownRef = useRef(false);

  // State-wise District and Tehsil data
  const stateDistrictTehsilData = {
    Punjab: {
      Amritsar: ["Amritsar-I", "Amritsar-II", "Ajnala", "Attari", "Baba Bakala", "Majitha", "Rayya", "Tarn Taran"],
      Barnala: ["Barnala", "Mehal Kalan", "Tapa"],
      Bathinda: ["Bathinda", "Sangat", "Talwandi Sabo", "Rampura Phul", "Maur"],
      Faridkot: ["Faridkot", "Jaito", "Kotkapura"],
      "Fatehgarh Sahib": ["Fatehgarh Sahib", "Amloh", "Bassi Pathana", "Khamanon", "Mandi Gobindgarh", "Sirhind"],
      Fazilka: ["Fazilka", "Abohar", "Jalalabad"],
      "Ferozepur": ["Ferozepur", "Fazilka", "Guru Har Sahai", "Zira", "Makhu"],
      Gurdaspur: ["Gurdaspur", "Batala", "Dera Baba Nanak", "Dhariwal", "Kahnuwan", "Kalanaur", "Pathankot", "Qadian", "Sri Hargobindpur", "Sujanpur"],
      Hoshiarpur: ["Hoshiarpur", "Dasuya", "Garhshankar", "Hariana", "Mukerian", "Talwara"],
      Jalandhar: ["Jalandhar-I", "Jalandhar-II", "Adampur", "Bhogpur", "Goraya", "Nakodar", "Phillaur", "Shahkot"],
      Kapurthala: ["Kapurthala", "Bhulath", "Dhilwan", "Phagwara", "Sultanpur Lodhi"],
      Ludhiana: ["Ludhiana East", "Ludhiana West", "Doraha", "Jagraon", "Khanna", "Payal", "Raikot", "Samrala"],
      Mansa: ["Mansa", "Budhlada", "Sardulgarh"],
      Moga: ["Moga", "Baghapurana", "Dharamkot", "Nihal Singh Wala"],
      "Mohali (S.A.S Nagar)": ["Mohali", "Derabassi", "Kharar", "Kurali"],
      "Muktsar": ["Muktsar", "Gidderbaha", "Malout"],
      "Pathankot": ["Pathankot", "Dhar Kalan", "Sujanpur"],
      Patiala: ["Patiala", "Nabha", "Rajpura", "Patran", "Samana"],
      Rupnagar: ["Rupnagar", "Anandpur Sahib", "Chamkaur Sahib", "Morinda", "Nangal"],
      "Sangrur": ["Sangrur", "Ahmedgarh", "Barnala", "Bhawanigarh", "Dhuri", "Dirba", "Lehragaga", "Longowal", "Malerkotla", "Moonak", "Sunam"],
      "Shaheed Bhagat Singh Nagar": ["Nawanshahr", "Balachaur", "Banga", "Garhshankar"],
      "Tarn Taran": ["Tarn Taran", "Khadur Sahib", "Patti", "Khem Karan"],
    },
    "Himachal Pradesh": {
      Bilaspur: ["Bilaspur", "Ghumarwin", "Jhandutta", "Sadar"],
      Chamba: ["Chamba", "Bharmour", "Churah", "Dalhousie", "Pangi", "Salooni"],
      Hamirpur: ["Hamirpur", "Barsar", "Bhoranj", "Nadaun", "Sujanpur"],
      Kangra: ["Kangra", "Baijnath", "Baroh", "Dehra", "Dharamshala", "Fatehpur", "Indora", "Jawalamukhi", "Jaisinghpur", "Kangra", "Khundian", "Nurpur", "Palampur", "Pragpur", "Rakkar", "Shahpur", "Sulah"],
      Kinnaur: ["Kinnaur", "Hangrang", "Kalpa", "Moorang", "Nichar", "Pooh"],
      Kullu: ["Kullu", "Ani", "Banjar", "Bhuntar", "Kullu", "Manali", "Naggar", "Nirmand"],
      "Lahaul and Spiti": ["Lahaul", "Spiti", "Keylong", "Udaipur"],
      Mandi: ["Mandi", "Aut", "Balh", "Bali Chowki", "Chachiot", "Dharmpur", "Gohar", "Jogindernagar", "Karsog", "Padhar", "Sarkaghat", "Sundernagar", "Thunag"],
      Shimla: ["Shimla", "Chirgaon", "Chopal", "Jubbal", "Kotkhai", "Kumarsain", "Nankhari", "Rampur", "Rohru", "Theog"],
      Sirmaur: ["Sirmaur", "Nahan", "Pachhad", "Paonta Sahib", "Rajgarh", "Sangrah", "Shillai"],
      Solan: ["Solan", "Arki", "Dharampur", "Kandaghat", "Kasauli", "Nalagarh"],
      Una: ["Una", "Amb", "Bangana", "Bharwain", "Gagret", "Haroli"]
    }
  };

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const resultsBySemester = useMemo(() => {
    // clone & sort
    const sorted = [...rawResults].sort(
      (a, b) =>
        Number(a.Subject?.semesterNumber || 0) -
        Number(b.Subject?.semesterNumber || 0)
    );
    // group
    return sorted.reduce((acc, res) => {
      const sem = res.Subject?.semesterNumber ?? "Unknown";
      (acc[sem] = acc[sem] || []).push(res);
      return acc;
    }, {});
  }, [rawResults]);

  const semesterList = Object.keys(resultsBySemester)
    .map((s) => (s === "Unknown" ? s : Number(s)))
    .sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return a - b;
    });

  // useEffect(() => {
  //   const loginData = localStorage.getItem("loginResponse");

  //   if (loginData) {
  //     try {
  //       const parsed = JSON.parse(loginData);
  //       // console.log(parsed.user.id)
  //       // adjust these paths based on your actual response shape
  //       setId(parsed.user.id);
  //     } catch (e) {
  //       console.error("Failed to parse loginResponse:", e);
  //     }
  //   }
  // }, []);

  // helper to map category → tag color
  const getCategoryColor = (cat) => {
    switch (cat) {
      case "GENERAL":
        return "blue";
      case "OBC":
        return "orange";
      case "SC":
        return "green";
      case "ST":
        return "purple";
      default:
        return "default";
    }
  };

  const getPlacementStatusColor = (status) => {
    switch (status) {
      case "ACCEPTED":
        return "success";
      case "JOINED":
        return "green";
      case "OFFERED":
        return "processing";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const fetchSemesters = async () => {
    try {
      const res = await API.get("/semesters");
      setSemesters(res.data || []);
    } catch {
      // Semesters endpoint may not exist - fail silently
      setSemesters([]);
    }
  };
  useEffect(() => {
    fetchSemesters();
  }, []);

  const getInternshipStatusColor = (status) => {
    const statusColors = {
      APPLIED: "blue",
      UNDER_REVIEW: "orange",
      SELECTED: "green",
      REJECTED: "red",
      JOINED: "purple",
      COMPLETED: "cyan",
    };
    return statusColors[status] || "default";
  };

  const getInternshipProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;

    return Math.round((elapsed / total) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // helper to look up semester name if you need it later
  const getSemesterName = (id) => {
    const semester = semesters.find((s) => s.id === id);
    return semester ? `Semester ${semester.number}` : id;
  };

  const fetchStudent = async () => {
    const loginData = localStorage.getItem("loginResponse");

    if (!loginData) {
      setError("Not logged in. Please log in again.");
      setLoading(false);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(loginData);
    } catch (e) {
      setError("Invalid session data. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = parsed?.user?.id || parsed?.userId || parsed?.id;
    if (!userId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setId(userId);

    try {
      const res = await API.get(`/students/profile/${userId}`);
      setStudent(res.data);

      // Check for missing required fields
      const studentData = res.data;
      const requiredFields = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'contact', label: 'Contact' },
        { key: 'parentName', label: 'Parent Name' },
        { key: 'parentContact', label: 'Parent Contact' },
        { key: 'gender', label: 'Gender' },
        { key: 'pinCode', label: 'Pin Code' },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City/Village' },
        { key: 'state', label: 'State' },
        { key: 'tehsil', label: 'Tehsil' },
        { key: 'district', label: 'District' },
        { key: 'category', label: 'Category' }
      ];

      const missingFields = requiredFields.filter(field => 
        !studentData[field.key] || studentData[field.key].toString().trim() === ''
      );

      if (missingFields.length > 0 && !toastShownRef.current) {
        const toastId = toast.error(
          (t) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span>Please complete your profile!</span>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ),
          {
            duration: Infinity,
            position: 'top-right',
            style: {
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '8px',
              minWidth: '300px',
            },
            icon: '⚠️',
          }
        );
        toastShownRef.current = toastId;
      }

      // compute stats
      const fees = res.data.fees || [];
      const totalDue = fees.reduce((sum, f) => sum + f.amountDue, 0);
      // compute original totals per-semester:
      const totalPaid = fees.reduce((sum, f) => sum + f.amountPaid, 0);
      const totalOriginal = fees.reduce(
        (sum, f) => sum + (f.amountPaid + f.amountDue),
        0
      );
      const feePct =
        totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;

      const results = res.data.results || [];
      const passed = results.filter((r) => r.marks >= 30).length;
      const totalSubj = results.length;
      const passPct =
        totalSubj > 0 ? Math.round((passed / totalSubj) * 100) : 0;

      setStats({
        feePercentage: feePct,
        passPercentage: passPct,
      });
    } catch (e) {
      console.error(e);
      setError("Failed to load student profile.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditSubmit = async (values) => {
    try {
      setImageUploading(true);

      // Create FormData for multipart request
      const formData = new FormData();

      // Add all form values to FormData
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });

      // Add profile image if selected
      if (profileImageList.length > 0 && profileImageList[0].originFileObj) {
        formData.append("profileImage", profileImageList[0].originFileObj);
      }

      await API.put(`/students/update-student/${student.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Student updated successfully", {
        duration: 4000,
        position: 'top-center',
      });
      setIsModalOpen(false);
      setProfileImageList([]);
      fetchStudent();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update student", {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setImageUploading(false);
    }
  };

  const openEditModal = () => {
    // Dismiss the profile incomplete toast if it exists
    if (toastShownRef.current) {
      toast.dismiss(toastShownRef.current);
      toastShownRef.current = false;
    }

    form.setFieldsValue({
      name: student.name,
      email: student.email,
      contact: student.contact,
      parentName: student.parentName,
      parentContact: student.parentContact,
      address: student.address,
      dob: student.dob ? student.dob.slice(0, 10) : null,
      city: student.city,
      state: student.state,
      pinCode: student.pinCode,
      tehsil: student.tehsil,
      gender: student.gender,
      district: student.district,
      tenthper: student.tenthper,
      twelthper: student.twelthper,
      rollNumber: student.rollNumber,
      // admissionNumber: student.admissionNumber,
      admissionType: student.admissionType,
      category: student.category,
      batchId: student.batch?.id,
    });

    // Set selected state and district for cascading dropdowns
    if (student.state) {
      setSelectedState(student.state);
    }
    if (student.district) {
      setSelectedDistrict(student.district);
    }

    // Reset image upload state
    setProfileImageList([]);
    setImageUploading(false);

    setIsModalOpen(true);
  };

  const openUploadModal = () => {
    uploadForm.resetFields();
    setFileList([]);
    setUploadModal(true);
  };

  const handleUpload = async (values) => {
    if (!fileList.length) return toast.error("Please select a file.");
    const formData = new FormData();
    formData.append("studentId", student.id);
    formData.append("type", values.type);
    formData.append("file", fileList[0]);

    try {
      setUploading(true);
      await API.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setUploadModal(false);
      fetchStudent();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="small" tip="Loading profile..." />
      </div>
    );
  if (error)
    return (
      <div style={{ padding: "32px" }}>
        <Text type="danger">{error}</Text>
      </div>
    );

  return (
    <div className="p-4 md:p-6 bg-background-secondary min-h-screen overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title level={2} className="mb-0 text-text-primary text-2xl font-black">My Profile</Title>
            <Text className="text-text-secondary text-sm">View and manage your personal and academic information</Text>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              icon={<EditOutlined />} 
              onClick={openEditModal} 
              className="rounded-xl h-10 px-6 font-bold flex-1 sm:flex-none border-border hover:border-primary hover:text-primary"
            >
              Edit Profile
            </Button>
            <Button
              type="primary"
              onClick={openUploadModal}
              icon={<UploadOutlined />}
              className="rounded-xl h-10 px-6 font-bold flex-1 sm:flex-none bg-primary border-0 shadow-lg shadow-primary/20"
            >
              Add Document
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="rounded-2xl border-border shadow-sm bg-surface overflow-hidden" styles={{ body: { padding: '24px' } }}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <Avatar
                size={110}
                src={getImageUrl(student.profileImage)}
                icon={<UserOutlined />}
                className="rounded-2xl border-4 border-background shadow-soft ring-1 ring-border"
              />
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${student.isActive ? 'bg-success' : 'bg-error'}`}>
                {student.isActive ? <CheckCircleOutlined className="text-white text-xs" /> : <StopOutlined className="text-white text-xs" />}
              </div>
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <Title level={2} className="!mb-0 !text-text-primary text-2xl md:text-3xl font-black">
                  {student.name}
                </Title>
                <Tag className="rounded-full px-3 py-0.5 bg-primary/10 text-primary border-0 font-bold uppercase tracking-wider text-[10px]">
                  {student.branchName}
                </Tag>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-text-secondary text-sm mb-6">
                <span className="flex items-center gap-1.5 font-medium">
                  <IdcardOutlined className="text-text-tertiary" /> {student.rollNumber}
                </span>
                <span className="w-1 h-1 rounded-full bg-text-tertiary opacity-30" />
                <span className="flex items-center gap-1.5 font-medium">
                  <BankOutlined className="text-text-tertiary" /> Batch of {student.batch?.name || 'N/A'}
                </span>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Tag color={getCategoryColor(student.category)} className="rounded-md border-0 px-3 py-0.5 font-bold text-[10px] uppercase tracking-widest m-0">
                  {student.category}
                </Tag>
                <Tag className="rounded-md border-0 bg-background-tertiary text-text-secondary px-3 py-0.5 font-bold text-[10px] uppercase tracking-widest m-0">
                  {student.admissionType}
                </Tag>
                {student.clearanceStatus && (
                  <Tag 
                    className="rounded-md border-0 px-3 py-0.5 font-bold text-[10px] uppercase tracking-widest m-0"
                    color={student.clearanceStatus === "CLEARED" ? "success" : "warning"}
                  >
                    {student.clearanceStatus}
                  </Tag>
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8 pl-8 border-l border-border/60">
              <div className="text-center">
                <div className="text-2xl font-black text-text-primary">{stats?.passPercentage || 0}%</div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-success">{stats?.feePercentage || 0}%</div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">Fees Paid</div>
              </div>
            </div>
          </div>

          {/* Quick Contact Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/60">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-tertiary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MailOutlined className="text-lg" />
              </div>
              <div className="min-w-0">
                <Text className="text-[10px] uppercase font-black text-text-tertiary tracking-widest block leading-none mb-1.5">Email Address</Text>
                <Text ellipsis className="text-sm font-bold text-text-primary block leading-none">{student.email}</Text>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-tertiary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                <PhoneOutlined className="text-lg" />
              </div>
              <div className="min-w-0">
                <Text className="text-[10px] uppercase font-black text-text-tertiary tracking-widest block leading-none mb-1.5">Phone Number</Text>
                <Text ellipsis className="text-sm font-bold text-text-primary block leading-none">{student.contact || "N/A"}</Text>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-tertiary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <CalendarOutlined className="text-lg" />
              </div>
              <div className="min-w-0">
                <Text className="text-[10px] uppercase font-black text-text-tertiary tracking-widest block leading-none mb-1.5">Date of Birth</Text>
                <Text ellipsis className="text-sm font-bold text-text-primary block leading-none">{student.dob?.slice(0, 10) || "N/A"}</Text>
              </div>
            </div>
          </div>
        </Card>

                  {/* Detailed Tabs Container */}

                  <Card className="rounded-2xl border-border shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>

                    <Tabs 

                      defaultActiveKey="1" 

                      className="custom-tabs"

                      items={[

                        {

                          key: "1",

                          label: (

                            <span className="flex items-center px-4 py-3 font-bold text-xs uppercase tracking-widest">

                              <UserOutlined className="mr-2" /> Personal Details

                            </span>

                          ),

                          children: (

                            <div className="p-8">

                              <Row gutter={[48, 32]}>

                                <Col xs={24} lg={12}>

                                  <div className="space-y-6">

                                    <div className="flex items-center gap-2 mb-2">

                                      <div className="w-1 h-4 rounded-full bg-primary" />

                                      <Title level={5} className="!mb-0 !text-text-primary text-sm uppercase tracking-widest font-black">Academic Profile</Title>

                                    </div>

                                    <div className="bg-background-tertiary/20 rounded-2xl border border-border/50 overflow-hidden">

                                      <div className="p-4 flex justify-between items-center border-b border-border/50">

                                        <Text className="text-text-tertiary font-medium">Roll Number</Text>

                                        <Text className="text-text-primary font-bold">{student.rollNumber}</Text>

                                      </div>

                                      <div className="p-4 flex justify-between items-center border-b border-border/50">

                                        <Text className="text-text-tertiary font-medium">Branch</Text>

                                        <Tag className="m-0 px-3 py-0.5 rounded-full border-0 bg-primary text-white font-bold text-[10px] uppercase tracking-wider">

                                          {student.branchName}

                                        </Tag>

                                      </div>

                                      <div className="p-4 flex justify-between items-center border-b border-border/50">

                                        <Text className="text-text-tertiary font-medium">Batch</Text>

                                        <Text className="text-text-primary font-bold">{student.batch?.name || "N/A"}</Text>

                                      </div>

                                      <div className="p-4 flex justify-between items-center">

                                        <Text className="text-text-tertiary font-medium">Admission Type</Text>

                                        <Tag className="m-0 px-3 py-0.5 rounded-full border-0 bg-background-tertiary text-text-secondary font-bold text-[10px] uppercase tracking-wider">

                                          {student.admissionType}

                                        </Tag>

                                      </div>

                                    </div>

                                  </div>

                                </Col>

          

                                <Col xs={24} lg={12}>

                                  <div className="space-y-6">

                                    <div className="flex items-center gap-2 mb-2">

                                      <div className="w-1 h-4 rounded-full bg-success" />

                                      <Title level={5} className="!mb-0 !text-text-primary text-sm uppercase tracking-widest font-black">Contact & Address</Title>

                                    </div>

                                    <div className="bg-background-tertiary/20 rounded-2xl border border-border/50 overflow-hidden">

                                      <div className="p-4 flex justify-between items-start border-b border-border/50">

                                        <Text className="text-text-tertiary font-medium shrink-0 mr-4">Home Address</Text>

                                        <Text className="text-text-primary font-bold text-right">{student.address || "N/A"}, {student.city}, {student.district}, {student.state} - {student.pinCode}</Text>

                                      </div>

                                      <div className="p-4 flex justify-between items-center border-b border-border/50">

                                        <Text className="text-text-tertiary font-medium">Parent/Guardian</Text>

                                        <Text className="text-text-primary font-bold">{student.parentName || "N/A"}</Text>

                                      </div>

                                      <div className="p-4 flex justify-between items-center">

                                        <Text className="text-text-tertiary font-medium">Parent Contact</Text>

                                        <Text className="text-text-primary font-bold">{student.parentContact || "N/A"}</Text>

                                      </div>

                                    </div>

                                  </div>

                                </Col>

                              </Row>

                            </div>

                          ),

                        },

                        {

                          key: "4",

                          label: (

                            <span className="flex items-center px-4 py-3 font-bold text-xs uppercase tracking-widest">

                              <FileTextOutlined className="mr-2" /> Academic Records

                            </span>

                          ),

                          children: (

                            <div className="p-8">

                              {student.document?.length > 0 ? (

                                <Row gutter={[20, 20]}>

                                  {student.document.map((doc, idx) => (

                                    <Col xs={24} sm={12} md={8} lg={6} key={idx}>

                                      <Card

                                        hoverable

                                        className="rounded-2xl border-border shadow-sm overflow-hidden bg-surface group"

                                        styles={{ body: { padding: '12px' } }}

                                        onClick={() => window.open(getImageUrl(doc.fileUrl), "_blank")}

                                      >

                                        <div className="h-40 rounded-xl bg-background-tertiary/30 flex items-center justify-center p-4 mb-3 border border-border/50 overflow-hidden">

                                          <img

                                            src={getImageUrl(doc.fileUrl)}

                                            alt={doc.fileName}

                                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"

                                          />

                                        </div>

                                        <div className="px-1">

                                          <Text className="text-xs uppercase font-black text-text-primary tracking-widest block truncate mb-1">

                                            {doc.type.replaceAll("_", " ")}

                                          </Text>

                                          <Text className="text-[10px] text-text-tertiary truncate block font-medium">

                                            {doc.fileName}

                                          </Text>

                                        </div>

                                      </Card>

                                    </Col>

                                  ))}

                                </Row>

                              ) : (

                                <div className="py-20 text-center bg-background-tertiary/30 rounded-2xl border border-dashed border-border flex flex-col items-center">

                                  <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />

                                  <Title level={5} className="text-text-secondary mt-4">No documents found</Title>

                                  <Button type="primary" onClick={openUploadModal} className="mt-6 rounded-xl font-bold bg-primary border-0 px-8">

                                    Upload Document

                                  </Button>

                                </div>

                              )}

                            </div>

                          ),

                        },

                                      {

                                        key: "5",

                                        label: (

                                          <span className="flex items-center px-4 py-3 font-bold text-xs uppercase tracking-widest">

                                            <BulbOutlined className="mr-2" /> Placements

                                          </span>

                                        ),

                                        children: (

                                          <div className="p-8">

                                            {(student.placements || []).length > 0 ? (

                                              <Row gutter={[20, 20]}>

                                                {(student.placements || []).map((p, i) => (

                                                  <Col xs={24} md={12} lg={8} key={i}>

                                                    <div className="p-5 rounded-2xl border border-border bg-surface hover:border-success/30 transition-all shadow-sm">

                                                      <div className="flex justify-between items-start mb-4">

                                                        <Title level={5} className="!mb-0 !text-text-primary text-base leading-tight flex-1 mr-2">{p.companyName}</Title>

                                                        <Tag color={getPlacementStatusColor(p.status)} className="m-0 px-2 py-0.5 rounded-md border-0 font-bold uppercase tracking-widest text-[9px]">

                                                          {p.status}

                                                        </Tag>

                                                      </div>

                                                      <div className="bg-success-50/50 p-3 rounded-xl border border-success-border/20 mb-4">

                                                        <Text className="text-[10px] uppercase font-bold text-success-700 tracking-widest block mb-1">Annual CTC</Text>

                                                        <Text className="text-xl font-black text-success-800 leading-none">

                                                          ₹ {p.salary?.toFixed(2)} <span className="text-[10px] font-bold">LPA</span>

                                                        </Text>

                                                      </div>

                                                      <div className="space-y-2">

                                                        <div className="flex items-center gap-2">

                                                          <SolutionOutlined className="text-text-tertiary text-xs" />

                                                          <Text className="text-xs font-bold text-text-secondary truncate">{p.jobRole}</Text>

                                                        </div>

                                                        <div className="flex items-center gap-2">

                                                          <CalendarOutlined className="text-text-tertiary text-xs" />

                                                          <Text className="text-xs font-bold text-text-secondary">{formatDate(p.offerDate)}</Text>

                                                        </div>

                                                      </div>

                                                    </div>

                                                  </Col>

                                                ))}

                                              </Row>

                                            ) : (

                                              <div className="py-20 text-center bg-background-tertiary/20 rounded-2xl border border-border/50 opacity-60">

                                                <Empty description="No placement offers found" image={Empty.PRESENTED_IMAGE_SIMPLE} />

                                              </div>

                                            )}

                                          </div>

                                        ),

                                      },

                                      {

                                        key: "6",

                                        label: (

                                          <span className="flex items-center px-4 py-3 font-bold text-xs uppercase tracking-widest">

                                            <LaptopOutlined className="mr-2" /> Career Track

                                          </span>

                                        ),

                                        children: (

                                          <div className="p-8 space-y-10">

                                            {/* Internship Section */}

                                            <section>

                                              <div className="flex items-center gap-2 mb-6">

                                                <div className="w-1 h-4 rounded-full bg-indigo-500" />

                                                <Title level={5} className="!mb-0 !text-text-primary text-sm uppercase tracking-widest font-black">Internship History</Title>

                                              </div>

                                              

                                              {(student.internshipApplications || []).length > 0 ? (

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                                  {(student.internshipApplications || [])

                                                    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))

                                                    .map((app, i) => {

                                                      const isSelf = !app.internshipId || !app.internship;

                                                      return (

                                                        <div key={i} className="p-5 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all shadow-sm">

                                                          <div className="flex justify-between items-start mb-4">

                                                            <div>

                                                              {isSelf && (

                                                                <Tag className="m-0 mb-2 px-2 py-0 rounded-md bg-purple-500/10 text-purple-600 border-0 text-[10px] font-black uppercase tracking-wider">

                                                                  Self-Identified

                                                                </Tag>

                                                              )}

                                                              <Title level={5} className="!mb-1 !text-text-primary text-base">

                                                                {isSelf ? app.companyName : app.internship?.title}

                                                              </Title>

                                                              <Text className="text-primary font-bold text-xs uppercase tracking-wider">

                                                                {!isSelf ? app.internship?.industry?.companyName : 'External Position'}

                                                              </Text>

                                                            </div>

                                                            <Tag color={getInternshipStatusColor(app.status)} className="m-0 px-3 py-0.5 rounded-full border-0 font-bold uppercase tracking-widest text-[9px]">

                                                              {app.status}

                                                            </Tag>

                                                          </div>

                                                          

                                                          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">

                                                            <div>

                                                              <Text className="text-[10px] uppercase font-bold text-text-tertiary block leading-none mb-1">Duration</Text>

                                                              <Text className="text-text-primary font-bold text-xs">{app.internship?.duration || app.internshipDuration || 'N/A'}</Text>

                                                            </div>

                                                            <div>

                                                              <Text className="text-[10px] uppercase font-bold text-text-tertiary block leading-none mb-1">Applied On</Text>

                                                              <Text className="text-text-primary font-bold text-xs">{formatDate(app.appliedDate)}</Text>

                                                            </div>

                                                          </div>

                                                          

                                                          {(app.status === "JOINED" || app.status === "COMPLETED") && (

                                                            <div className="mt-4">

                                                              <div className="flex justify-between text-[9px] font-black text-text-tertiary uppercase tracking-widest mb-1.5">

                                                                <span>Course Progress</span>

                                                                <span>{getInternshipProgress(app.internship?.startDate, app.internship?.endDate)}%</span>

                                                              </div>

                                                              <Progress 

                                                                percent={getInternshipProgress(app.internship?.startDate, app.internship?.endDate)} 

                                                                size="small" 

                                                                showInfo={false} 

                                                                strokeColor="rgb(var(--color-primary))"

                                                                trailColor="rgba(var(--color-border), 0.1)"

                                                              />

                                                            </div>

                                                          )}

                                                        </div>

                                                      );

                                                    })}

                                                </div>

                                              ) : (

                                                <div className="py-12 text-center bg-background-tertiary/20 rounded-2xl border border-border/50 opacity-60">

                                                  <Empty description="No internship history recorded" image={Empty.PRESENTED_IMAGE_SIMPLE} />

                                                </div>

                                              )}

                                            </section>

                                          </div>

                                        ),

                                      },

                                    ]}

                                  />

                                </Card>
        </div>

      {/* Modals */}
      <Modal
        title="Edit Student Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={imageUploading}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Row gutter={16}>
            {/* Profile Image Upload */}
            <Col span={24}>
              <Form.Item label="Profile Image">
                <div className="flex items-center gap-4">
                  <Avatar
                    size={80}
                    src={getImageUrl(student?.profileImage)}
                    icon={<UserOutlined />}
                  />
                  <ImgCrop
                    rotationSlider
                    aspect={1}
                    quality={0.8}
                    modalTitle="Crop Profile Image"
                    modalOk="Crop"
                    modalCancel="Cancel"
                  >
                    <Upload
                      listType="picture-card"
                      fileList={profileImageList}
                      onChange={({ fileList: newFileList }) => {
                        setProfileImageList(newFileList);
                      }}
                      beforeUpload={(file) => {
                        const isJpgOrPng =
                          file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png";
                        if (!isJpgOrPng) {
                          toast.error("You can only upload JPG/JPEG/PNG files!");
                          return Upload.LIST_IGNORE;
                        }
                        const isLt2M = file.size / 1024 / 1024 < 2;
                        if (!isLt2M) {
                          toast.error("Image must be smaller than 2MB!");
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                      maxCount={1}
                      className="avatar-uploader"
                    >
                      {profileImageList.length < 1 && (
                        <div>
                          <CameraOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </ImgCrop>
                </div>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, type: "email" }]}
                >
                  <Input prefix={<MailOutlined className="text-gray-400" />} />
                </Form.Item>
              </Col>

            <Col span={12}>
              <Form.Item
                name="contact"
                label="Contact"
                rules={[{ required: true }]}
              >
                <Input prefix={<PhoneOutlined className="text-gray-400" />} />
              </Form.Item>
            </Col>
            {/* <Col span={12}>
                <Form.Item
                  name="rollNumber"
                  label="Roll Number"
                  rules={[{ required: true }]}
                >
                  <Input
                    prefix={<IdcardOutlined className="text-gray-400" />}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="admissionNumber"
                  label="Admission Number"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="admissionType"
                  label="Admission Type"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Type">
                    <Select.Option value="REGULAR">Regular</Select.Option>
                    <Select.Option value="LEET">LEET</Select.Option>
                  </Select>
                </Form.Item>
              </Col>*/}

              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Category">
                    <Select.Option value="GENERAL">General</Select.Option>
                    <Select.Option value="SC">SC</Select.Option>
                    <Select.Option value="ST">ST</Select.Option>
                    <Select.Option value="OBC">OBC</Select.Option>
                  </Select>
                </Form.Item>
              </Col> 

            <Col span={12}>
              <Form.Item
                name="parentName"
                label="Parent Name"
                rules={[{ required: true }]}
              >
                <Input prefix={<TeamOutlined className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parentContact"
                label="Parent Contact"
                rules={[{ required: true }]}
              >
                <Input prefix={<PhoneOutlined className="text-gray-400" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true }]}
              >
                <Select placeholder="Gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dob"
                label="Date of Birth"
                rules={[{ required: false }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pinCode"
                label="Pin Code"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City/Village"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please select state' }]}
              >
                <Select 
                  placeholder="Select State"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(value) => {
                    setSelectedState(value);
                    setSelectedDistrict("");
                    form.setFieldsValue({ district: undefined, tehsil: undefined }); // Reset district and tehsil when state changes
                  }}
                >
                  {Object.keys(stateDistrictTehsilData).sort().map((state) => (
                    <Select.Option key={state} value={state}>
                      {state}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: 'Please select district' }]}
              >
                <Select 
                  placeholder={selectedState ? "Select District" : "Select State First"}
                  disabled={!selectedState}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(value) => {
                    setSelectedDistrict(value);
                    form.setFieldsValue({ tehsil: undefined }); // Reset tehsil when district changes
                  }}
                >
                  {selectedState && Object.keys(stateDistrictTehsilData[selectedState] || {}).sort().map((district) => (
                    <Select.Option key={district} value={district}>
                      {district}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tehsil"
                label="Tehsil"
                rules={[{ required: true, message: 'Please select tehsil' }]}
              >
                <Select 
                  placeholder={selectedDistrict ? "Select Tehsil" : "Select District First"}
                  disabled={!selectedDistrict}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {selectedState && selectedDistrict && stateDistrictTehsilData[selectedState]?.[selectedDistrict]?.map((tehsil) => (
                    <Select.Option key={tehsil} value={tehsil}>
                      {tehsil}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Upload Document"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        onOk={() => uploadForm.submit()}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            name="type"
            label="Document Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select type">
              <Option value="MARKSHEET_10TH">10th Marksheet</Option>
              <Option value="MARKSHEET_12TH">12th Marksheet</Option>
              <Option value="CASTE_CERTIFICATE">Caste Certificate</Option>
              <Option value="PHOTO">Photo</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Upload File">
            <Upload
              beforeUpload={(file) => {
                const isUnderLimit = file.size / 1024 <= 200;
                if (!isUnderLimit) {
                  toast.error("File must be less than 200KB.");
                  return Upload.LIST_IGNORE;
                }
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
              listType="picture"
            >
              <Button
                loading={uploading}
                icon={<UploadOutlined />}
                className="w-full"
              >
                Select File (Max 200KB)
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}