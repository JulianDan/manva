import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/zh-cn'; // 引入 moment.js 中文语言包
import { Avatar, List, Row, Col, Typography, Spin, notification } from 'antd'; // 添加 notification 组件
import { LoadingOutlined } from '@ant-design/icons';
const { Text } = Typography;

const PostHead = ({ displayName, username, time, avatar }) => (
  <Col style={{ display: 'flex', alignItems: 'center' }}>
    <Col flex="50px" style={{ flexShrink: 0 }}>
      <Avatar size="large" src={avatar} />
    </Col>
    <Col flex="auto" style={{ flexShrink: 0 }}>
      <Row>
        <Text strong>{displayName}</Text>
      </Row>
      <Row>
        <Text type="secondary">@{username}</Text>
        <Text type="secondary">&nbsp;·&nbsp;</Text>
        <Text type="secondary">{moment(time).fromNow()}</Text>
      </Row>
    </Col>
  </Col>
);

const PostContent = ({ content }) => (
  <div dangerouslySetInnerHTML={{ __html: content }}></div>
);

const PostTail = () => (
  <Row justify="end">
    
  </Row>
);

const Post = ({ post }) => {
  if (!post) {
    return <div>Loading...</div>;
  }

  const {
    id,
    account: { display_name, acct, avatar_static },
    content,
    created_at,
  } = post;

  return (
    <List.Item key={id}>
      <Col>
        <PostHead
          displayName={display_name}
          username={acct}
          time={created_at}
          avatar={avatar_static}
        />
        <PostContent content={content} />
        <PostTail />
      </Col>
    </List.Item>
  );
};

const Timeline = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [hasMore, setHasMore] = useState(true); // 添加 hasMore 状态来判断是否还有更多内容

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('https://miao.social/api/v1/timelines/public');
        setPosts(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 600;

    if (isBottom && !adding && hasMore) {
      setAdding(true);
      handleLoadMore();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [adding, hasMore, loading]);

  const handleLoadMore = async () => {
    try {
      const lastPostId = posts[posts.length - 1].id;
      const response = await axios.get(`https://miao.social/api/v1/timelines/public?max_id=${lastPostId}`);
      if (response.data.length === 0) { // 如果返回的数据为空，说明没有更多内容了
        window.removeEventListener('scroll', handleScroll); // 移除滚动监听事件
        return;
      }
      setPosts([...posts, ...response.data]);
    } catch (error) {
      console.error(error);
      notification.error({
        message: '加载失败',
        description: '请检查网络连接或稍后再试',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    const url = e.target.href;
    window.open(url, '_blank');
  };

  const antIcon = <LoadingOutlined style={{ fontSize: 72 }} spin />;
  return (
    <div style={{ maxWidth: '40%', margin: '0 auto' }}>
      {loading ? ( // 根据 loading 状态来显示 Spin 或 List
        <div className="loading-container">
          <Spin size="large" indicator={antIcon}/>
        </div>
      ) : (
        <List
          className="post-list"
          dataSource={posts}
          renderItem={(post) => (
            <List.Item>
              <Post post={post} handleLinkClick={handleLinkClick} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export default Timeline;