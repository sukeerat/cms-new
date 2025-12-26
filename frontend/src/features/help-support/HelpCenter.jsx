import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Collapse,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  UploadOutlined,
  LikeOutlined,
  DislikeOutlined,
  EyeOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { helpSupportService, SUPPORT_CATEGORIES, TICKET_PRIORITY } from '../../services/helpSupport.service';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Enhanced markdown-like text to HTML converter with table support
const renderMarkdown = (text) => {
  if (!text) return '';

  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/);

  const processedParagraphs = paragraphs.map(para => {
    // Check if this is a table (contains | characters on multiple lines)
    const lines = para.split('\n');
    const isTable = lines.length >= 2 &&
      lines[0].includes('|') &&
      lines[1].includes('|') &&
      lines.some(l => l.match(/^[\s|:-]+$/)); // Has separator row

    if (isTable) {
      const tableLines = lines.filter(l => l.trim() && !l.match(/^[\s|:-]+$/));
      if (tableLines.length > 0) {
        const headerCells = tableLines[0].split('|').map(c => c.trim()).filter(c => c);
        const bodyRows = tableLines.slice(1);

        let tableHtml = `<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse">`;
        tableHtml += `<thead><tr class="bg-background-tertiary">`;
        headerCells.forEach(cell => {
          tableHtml += `<th class="text-left px-3 py-2 font-semibold text-text-primary border-b border-border">${cell}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        bodyRows.forEach((row, idx) => {
          const cells = row.split('|').map(c => c.trim()).filter(c => c);
          const rowClass = idx % 2 === 1 ? 'bg-background-secondary/30' : '';
          tableHtml += `<tr class="${rowClass}">`;
          cells.forEach(cell => {
            tableHtml += `<td class="px-3 py-2 text-text-secondary border-b border-border/50">${cell}</td>`;
          });
          tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table></div>`;
        return tableHtml;
      }
    }

    let html = para
      // Escape HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold text with **
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
      // Code/monospace with backticks
      .replace(/`([^`]+)`/g, '<code class="bg-background-tertiary px-1.5 py-0.5 rounded text-primary text-sm font-mono">$1</code>');

    // Check if this paragraph is a list
    const listLines = html.split('\n');
    const isBulletList = listLines.every(line => line.trim() === '' || line.trim().startsWith('•') || line.trim().startsWith('-'));
    const isNumberedList = listLines.every(line => line.trim() === '' || /^\d+\./.test(line.trim()));

    if (isBulletList && listLines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'))) {
      const listItems = listLines
        .filter(line => line.trim())
        .map(line => {
          const content = line.replace(/^[•-]\s*/, '').trim();
          return `<li class="mb-1.5 pl-1">${content}</li>`;
        })
        .join('');
      return `<ul class="list-disc list-outside ml-5 my-3 space-y-1 text-text-secondary">${listItems}</ul>`;
    }

    if (isNumberedList && listLines.some(line => /^\d+\./.test(line.trim()))) {
      const listItems = listLines
        .filter(line => line.trim())
        .map(line => {
          const content = line.replace(/^\d+\.\s*/, '').trim();
          return `<li class="mb-1.5 pl-1">${content}</li>`;
        })
        .join('');
      return `<ol class="list-decimal list-outside ml-5 my-3 space-y-1 text-text-secondary">${listItems}</ol>`;
    }

    // Check if it's a header-like line (ends with :)
    if (html.trim().endsWith(':') && !html.includes('<li>') && html.length < 100) {
      return `<p class="font-semibold text-text-primary mt-4 mb-2">${html}</p>`;
    }

    // Regular paragraph
    html = html.replace(/\n/g, '<br/>');
    return `<p class="mb-3 text-text-secondary leading-relaxed">${html}</p>`;
  });

  return processedParagraphs.join('');
};

const HelpCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularFaqs, setPopularFaqs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  // Ticket modal state
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketForm] = Form.useForm();

  // Fetch FAQs and categories
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [faqsData, categoriesData, popularData] = await Promise.all([
        helpSupportService.getPublishedFAQs(),
        helpSupportService.getFAQCategories(),
        helpSupportService.getPopularFAQs(5),
      ]);
      setFaqs(faqsData);
      setCategories(categoriesData);
      setPopularFaqs(popularData);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      message.error('Failed to load help articles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search FAQs
  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await helpSupportService.searchFAQs(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search FAQs:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Filter FAQs by category
  const filteredFAQs = selectedCategory
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  // Display FAQs (search results or filtered)
  const displayFAQs = searchResults !== null ? searchResults : filteredFAQs;

  // Mark FAQ as helpful
  const handleMarkHelpful = async (id) => {
    try {
      await helpSupportService.markFAQHelpful(id);
      message.success('Thanks for your feedback!');
      // Update local state to reflect the change
      setFaqs(prev => prev.map(faq =>
        faq.id === id ? { ...faq, helpfulCount: (faq.helpfulCount || 0) + 1 } : faq
      ));
    } catch (error) {
      console.error('Failed to mark FAQ helpful:', error);
    }
  };

  // Handle vote (helpful/not helpful)
  const handleVote = async (id, type) => {
    if (type === 'up') {
      await handleMarkHelpful(id);
    } else {
      // For 'down' votes, just show feedback message (no backend tracking for unhelpful)
      message.info('Thanks for your feedback! We\'ll work to improve this article.');
    }
  };

  // Submit ticket
  const handleSubmitTicket = async (values) => {
    setSubmittingTicket(true);
    try {
      await helpSupportService.createTicket({
        subject: values.subject,
        description: values.description,
        category: values.category,
        priority: values.priority || 'MEDIUM',
        attachments: [],
      });
      message.success('Support ticket submitted successfully! We will respond soon.');
      setTicketModalVisible(false);
      ticketForm.resetFields();
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      message.error('Failed to submit support ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Category color helper
  const getCategoryInfo = (category) => {
    return SUPPORT_CATEGORIES[category] || { label: category, color: 'default' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Loading help center..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-sm mr-3">
              <CustomerServiceOutlined className="text-lg" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-text-primary text-2xl">
                Help & Support Center
              </Title>
              <Paragraph className="text-text-secondary text-sm mb-0">
                Find answers to common questions or submit a support ticket
              </Paragraph>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="rounded-2xl border-border shadow-sm bg-surface" styles={{ body: { padding: '24px' } }}>
          <Input
            size="large"
            placeholder="Search for help articles..."
            prefix={<SearchOutlined className="text-text-tertiary" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="rounded-xl h-12 bg-background border-border"
          />
        </Card>

        <Row gutter={[24, 24]}>
          {/* Categories Sidebar */}
          <Col xs={24} md={6}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <BookOutlined className="text-primary" />
                  <span className="font-bold text-text-primary">Categories</span>
                </div>
              }
              className="rounded-2xl border-border shadow-sm bg-surface"
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button
                  type={selectedCategory === null ? 'primary' : 'text'}
                  block
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-lg h-10 text-left justify-start ${selectedCategory === null ? 'font-bold' : 'text-text-secondary'}`}
                >
                  All Articles ({faqs.length})
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.category}
                    type={selectedCategory === cat.category ? 'primary' : 'text'}
                    block
                    onClick={() => setSelectedCategory(cat.category)}
                    className={`rounded-lg h-10 text-left justify-start ${selectedCategory === cat.category ? 'font-bold' : 'text-text-secondary'}`}
                  >
                    {cat.label} ({cat.count})
                  </Button>
                ))}
              </Space>
            </Card>

            {/* Popular Articles */}
            {popularFaqs.length > 0 && (
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FireOutlined className="text-orange-500" />
                    <span className="font-bold text-text-primary">Popular Articles</span>
                  </div>
                }
                className="mt-4 rounded-2xl border-border shadow-sm bg-surface"
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  {popularFaqs.slice(0, 5).map((faq, index) => (
                    <div
                      key={faq.id}
                      className="py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-background-secondary/30 -mx-3 px-3 transition-colors"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSearchQuery('');
                        setSearchResults(null);
                        setActiveKey(faq.id);
                        // Scroll to the FAQ after a short delay to allow state updates
                        setTimeout(() => {
                          document.getElementById(`faq-${faq.id}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }, 100);
                      }}
                    >
                      <Text className="text-text-primary text-sm leading-snug line-clamp-2 hover:text-primary">
                        {index + 1}. {faq.title}
                      </Text>
                      <Text className="text-text-tertiary text-xs flex items-center gap-1 mt-1">
                        <EyeOutlined /> {faq.viewCount} views
                      </Text>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {/* Submit Ticket Card */}
            <Card className="mt-4 rounded-2xl border-border shadow-sm bg-surface" size="small">
              <Title level={5} className="mb-2 text-text-primary flex items-center gap-2">
                <QuestionCircleOutlined className="text-warning" /> Need more help?
              </Title>
              <Text className="text-text-secondary block mb-4 text-sm">
                Can't find what you're looking for? Submit a ticket and we'll help you out.
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={() => setTicketModalVisible(true)}
                className="rounded-xl h-10 font-bold shadow-lg shadow-primary/20"
              >
                Submit a Ticket
              </Button>
            </Card>
          </Col>

          {/* FAQ Articles */}
          <Col xs={24} md={18}>
            {searching ? (
              <div className="text-center py-12">
                <Spin tip="Searching..." />
              </div>
            ) : displayFAQs.length === 0 ? (
              <Card className="rounded-2xl border-border shadow-sm bg-surface text-center py-12">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-text-secondary">
                      {searchQuery ? `No articles found for "${searchQuery}"` : 'No articles available'}
                    </span>
                  }
                >
                  <Button type="primary" onClick={() => setTicketModalVisible(true)} className="rounded-xl h-10 font-bold mt-4">
                    Submit a Ticket
                  </Button>
                </Empty>
              </Card>
            ) : (
              <>
                {searchResults !== null && (
                  <Text className="text-text-secondary block mb-4 font-medium">
                    Found {searchResults.length} results for "{searchQuery}"
                  </Text>
                )}

                <Card className="rounded-2xl border-border shadow-sm bg-surface overflow-hidden" styles={{ body: { padding: 0 } }}>
                  <Collapse
                    accordion
                    activeKey={activeKey}
                    onChange={(key) => setActiveKey(key)}
                    expandIconPosition="end"
                    ghost
                    className="custom-collapse"
                    items={displayFAQs.map((faq) => ({
                      key: faq.id,
                      id: `faq-${faq.id}`,
                      className: "border-b border-border last:border-0 hover:bg-background-secondary/30 transition-colors",
                      label: (
                        <div className="py-3" id={`faq-${faq.id}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <QuestionCircleOutlined className="text-primary text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Text strong className="text-text-primary text-[15px] block mb-1.5 leading-snug">{faq.title}</Text>
                              <Space size={8} wrap>
                                <Tag color={getCategoryInfo(faq.category).color} className="rounded-md border-0 font-bold uppercase tracking-wider text-[10px] m-0">
                                  {getCategoryInfo(faq.category).label}
                                </Tag>
                                <Text className="text-text-tertiary text-xs flex items-center gap-1">
                                  <EyeOutlined /> {faq.viewCount} views
                                </Text>
                                <Text className="text-text-tertiary text-xs flex items-center gap-1">
                                  <LikeOutlined /> {faq.helpfulCount || 0} found helpful
                                </Text>
                              </Space>
                            </div>
                          </div>
                        </div>
                      ),
                      children: (
                        <div className="pb-5 pl-11 pr-4">
                          {faq.summary && (
                            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-3 mb-4">
                              <Text className="text-text-secondary text-sm italic">{faq.summary}</Text>
                            </div>
                          )}
                          <div
                            className="faq-content text-text-secondary leading-relaxed mb-6"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(faq.content) }}
                          />

                          <Divider className="my-4 border-border/50" />

                          <div className="flex items-center justify-between">
                            <Text className="text-xs text-text-tertiary font-medium">Was this helpful?</Text>
                            <Space>
                              <Button
                                size="small"
                                icon={<LikeOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(faq.id, 'up');
                                }}
                                className="rounded-md text-xs hover:text-success hover:border-success"
                              >
                                Yes
                              </Button>
                              <Button
                                size="small"
                                icon={<DislikeOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(faq.id, 'down');
                                }}
                                className="rounded-md text-xs hover:text-error hover:border-error"
                              >
                                No
                              </Button>
                            </Space>
                          </div>
                        </div>
                      )
                    }))}
                  />
                </Card>
              </>
            )}
          </Col>
        </Row>

        {/* Submit Ticket Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <PlusOutlined />
              </div>
              <span className="text-text-primary font-bold">Submit Support Ticket</span>
            </div>
          }
          open={ticketModalVisible}
          onCancel={() => {
            setTicketModalVisible(false);
            ticketForm.resetFields();
          }}
          footer={null}
          width={600}
          className="rounded-2xl overflow-hidden"
        >
          <Form
            form={ticketForm}
            layout="vertical"
            onFinish={handleSubmitTicket}
            className="pt-4"
          >
            <Form.Item
              name="subject"
              label={<span className="font-medium text-text-primary">Subject</span>}
              rules={[
                { required: true, message: 'Please enter a subject' },
                { min: 5, message: 'Subject must be at least 5 characters' },
              ]}
            >
              <Input placeholder="Brief description of your issue" className="rounded-lg h-11 bg-background border-border" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label={<span className="font-medium text-text-primary">Category</span>}
                  rules={[{ required: true, message: 'Please select a category' }]}
                >
                  <Select placeholder="Select category" className="rounded-lg h-11">
                    {Object.values(SUPPORT_CATEGORIES).map((cat) => (
                      <Select.Option key={cat.value} value={cat.value}>
                        {cat.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label={<span className="font-medium text-text-primary">Priority</span>}
                  initialValue="MEDIUM"
                >
                  <Select className="rounded-lg h-11">
                    {Object.values(TICKET_PRIORITY).map((p) => (
                      <Select.Option key={p.value} value={p.value}>
                        <Tag color={p.color} className="mr-0 rounded-md border-0 font-bold text-[10px] uppercase tracking-wider">{p.label}</Tag>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label={<span className="font-medium text-text-primary">Description</span>}
              rules={[
                { required: true, message: 'Please describe your issue' },
                { min: 20, message: 'Description must be at least 20 characters' },
              ]}
            >
              <TextArea
                rows={6}
                placeholder="Please describe your issue in detail. Include any relevant information that might help us resolve it faster."
                className="rounded-lg bg-background border-border p-3"
              />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button onClick={() => setTicketModalVisible(false)} className="rounded-xl h-10 font-medium">
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submittingTicket}
                className="rounded-xl h-10 font-bold bg-primary border-0 shadow-lg shadow-primary/20"
              >
                Submit Ticket
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default HelpCenter;
