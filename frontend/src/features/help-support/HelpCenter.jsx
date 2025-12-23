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
} from 'antd';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  UploadOutlined,
  LikeOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { helpSupportService, SUPPORT_CATEGORIES, TICKET_PRIORITY } from '../../services/helpSupport.service';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

// Simple markdown-like text to HTML converter
const renderMarkdown = (text) => {
  if (!text) return '';

  // Convert markdown-like formatting to HTML
  let html = text
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold text with **
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Bullet points with •
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    // Numbered lists (1., 2., etc.)
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Convert newlines to <br> for regular text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap list items in <ul> tags
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul style="margin: 8px 0; padding-left: 20px;">$&</ul>');
  }

  return `<p>${html}</p>`;
};

const HelpCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Ticket modal state
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketForm] = Form.useForm();

  // Fetch FAQs and categories
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [faqsData, categoriesData] = await Promise.all([
        helpSupportService.getPublishedFAQs(),
        helpSupportService.getFAQCategories(),
      ]);
      setFaqs(faqsData);
      setCategories(categoriesData);
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
    } catch (error) {
      console.error('Failed to mark FAQ helpful:', error);
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
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Card style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CustomerServiceOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 16 }} />
        <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>Help & Support Center</Title>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
          Find answers to common questions or submit a support ticket
        </Text>

        {/* Search Bar */}
        <div style={{ maxWidth: 600, margin: '24px auto 0' }}>
          <Input
            size="large"
            placeholder="Search for help articles..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Categories Sidebar */}
        <Col xs={24} md={6}>
          <Card title={<><BookOutlined /> Categories</>} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type={selectedCategory === null ? 'primary' : 'text'}
                block
                onClick={() => setSelectedCategory(null)}
              >
                All Articles ({faqs.length})
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.category}
                  type={selectedCategory === cat.category ? 'primary' : 'text'}
                  block
                  onClick={() => setSelectedCategory(cat.category)}
                  style={{ textAlign: 'left' }}
                >
                  {cat.label} ({cat.count})
                </Button>
              ))}
            </Space>
          </Card>

          {/* Submit Ticket Card */}
          <Card style={{ marginTop: 16 }} size="small">
            <Title level={5} style={{ marginBottom: 12 }}>
              <QuestionCircleOutlined /> Can't find what you're looking for?
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Submit a support ticket and our team will help you.
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              onClick={() => setTicketModalVisible(true)}
            >
              Submit a Ticket
            </Button>
          </Card>
        </Col>

        {/* FAQ Articles */}
        <Col xs={24} md={18}>
          {searching ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin tip="Searching..." />
            </div>
          ) : displayFAQs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchQuery
                  ? `No articles found for "${searchQuery}"`
                  : 'No articles available'
              }
            >
              <Button type="primary" onClick={() => setTicketModalVisible(true)}>
                Submit a Ticket
              </Button>
            </Empty>
          ) : (
            <>
              {searchResults !== null && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Found {searchResults.length} results for "{searchQuery}"
                </Text>
              )}

              <Collapse
                accordion
                expandIconPosition="end"
                style={{ background: '#fff' }}
              >
                {displayFAQs.map((faq) => (
                  <Panel
                    key={faq.id}
                    header={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text strong>{faq.title}</Text>
                        <Space size={8}>
                          <Tag color={getCategoryInfo(faq.category).color}>
                            {getCategoryInfo(faq.category).label}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <EyeOutlined /> {faq.viewCount}
                          </Text>
                        </Space>
                      </Space>
                    }
                  >
                    <div style={{ marginBottom: 16 }}>
                      {faq.summary && (
                        <Paragraph type="secondary" style={{ fontStyle: 'italic' }}>
                          {faq.summary}
                        </Paragraph>
                      )}
                      <div
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(faq.content) }}
                        style={{ lineHeight: 1.8 }}
                      />
                    </div>

                    {faq.tags && faq.tags.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        {faq.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                      <Space>
                        <Text type="secondary">Was this helpful?</Text>
                        <Button
                          size="small"
                          icon={<LikeOutlined />}
                          onClick={() => handleMarkHelpful(faq.id)}
                        >
                          Yes ({faq.helpfulCount || 0})
                        </Button>
                      </Space>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            </>
          )}
        </Col>
      </Row>

      {/* Submit Ticket Modal */}
      <Modal
        title={<><PlusOutlined /> Submit Support Ticket</>}
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          ticketForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleSubmitTicket}
        >
          <Form.Item
            name="subject"
            label="Subject"
            rules={[
              { required: true, message: 'Please enter a subject' },
              { min: 5, message: 'Subject must be at least 5 characters' },
            ]}
          >
            <Input placeholder="Brief description of your issue" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {Object.values(SUPPORT_CATEGORIES).map((cat) => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="MEDIUM"
          >
            <Select>
              {Object.values(TICKET_PRIORITY).map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  <Tag color={p.color}>{p.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please describe your issue' },
              { min: 20, message: 'Description must be at least 20 characters' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Please describe your issue in detail. Include any relevant information that might help us resolve it faster."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTicketModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submittingTicket}>
                Submit Ticket
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HelpCenter;
