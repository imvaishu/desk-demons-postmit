const sinon = require('sinon');
const { assert } = require('chai');
const App = require('../src/app');

describe('#App', () => {
  const userId = 1;
  const postId = 1;

  const userDetails = {
    name: 'john samuel',
    username: 'john',
    userId,
    dob: '2020-08-03',
    imageUrl: 'url',
    joinedDate: '2020-08-03',
  };
  const hashtags = [{ hashtag: 'html' }];
  const responses = [
    { postId: 2, message: 'response', postedAt: '2020-08-03', ...userDetails },
  ];

  const reposts = [
    { ...userDetails, postId, message: 'repost', postedAt: '2020-08-03' },
  ];

  const createDummyPosts = function () {
    return [
      {
        postId: postId,
        postedAt: '2020-08-03',
        message: 'post',
        imageUrl: 'url',
        ...userDetails,
      },
    ];
  };
  const createApp = function (datastore) {
    const app = new App(datastore);
    app.userId = userId;
    app.username = userDetails.username;
    app.fullName = userDetails.name;
    app.imageUrl = 'url';
    app.initials = 'JS';
    return app;
  };

  const expectedTableError = new Error('Error: Table not found');
  const expectedUserDetailsError = new Error('Error: Invalid userId');

  describe('updateUser()', () => {
    const getUserDetailsStub = sinon.stub().resolves(userDetails);
    it('should update the userDetails in App if user is present', async () => {
      const app = new App({ getUserDetails: getUserDetailsStub });
      await app.updateUser(userId);
      assert.strictEqual(app.userId, userId);
      assert.strictEqual(app.username, userDetails.username);
      assert.strictEqual(app.fullName, userDetails.name);
      sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
    });

    it('should reject any error', async () => {
      const getUserDetailsStub = sinon.stub().rejects(expectedUserDetailsError);
      const app = new App({ getUserDetails: getUserDetailsStub });
      try {
        await app.updateUser(userId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedUserDetailsError);
        assert.isUndefined(app.userId);
        assert.isUndefined(app.username);
        assert.isUndefined(app.fullName);
        sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
      }
    });
  });

  describe('updatePostActions()', () => {
    it('should give all the post related actions of the given post', async () => {
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getBookmarksStub = sinon.stub().resolves([postId]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getAllPostLikers: getAllPostLikersStub,
        getAllResponses: getAllResponsesStub,
        getBookmarks: getBookmarksStub,
        getAllReposts: getAllRepostsStub,
      });
      const expected = {
        isBookmarked: false,
        isDeletable: false,
        isLiked: true,
        isReposted: false,
        likedUsers: [
          {
            userId: 1,
          },
        ],
        postId: 1,
        responseCount: 1,
        repostCount: 0,
      };
      const actual = await app.updatePostActions(userId, { postId });
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
    });

    it('should handle all the errors', async () => {
      const getAllPostLikersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        getAllPostLikers: getAllPostLikersStub,
      });
      try {
        await app.updatePostActions(userId, { postId });
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      }
    });
  });

  describe('updatePosts()', () => {
    it('should update the given posts with required details', async () => {
      const getBookmarksStub = sinon.stub().resolves([]);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getReplyingToStub = sinon.stub().resolves({ username: 'ram' });
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
        getAllResponses: getAllResponsesStub,
        getReplyingTo: getReplyingToStub,
      });
      const expected = [
        {
          ...userDetails,
          repostCount: 0,
          initials: 'JS',
          isDeletable: true,
          isLiked: true,
          likedUsers: [{ userId: 1 }],
          message: 'post',
          postId: 1,
          postedAt: '2020-08-03',
          isBookmarked: false,
          mentions: [],
          hashtags: ['html'],
          replyingTo: 'ram',
          responseCount: 1,
          isReposted: false,
        },
      ];
      const actual = await app.updatePosts(userId, createDummyPosts());
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
    });

    it('should reject any error', async () => {
      const getAllPostLikersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getAllPostLikers: getAllPostLikersStub });
      try {
        await app.updatePosts(userId, createDummyPosts());
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      }
    });
  });

  describe('getPostDetails()', () => {
    it('should give all the post details based on postId', async () => {
      const expectedPost = {
        ...userDetails,
        postId,
        postedAt: '2020-08-03',
        responseCount: 1,
        message: 'hello',
        isBookmarked: false,
      };
      const getPostStub = sinon.stub().resolves(expectedPost);
      const getBookmarksStub = sinon.stub().resolves([]);
      const getAllPostLikersStub = sinon.stub().resolves([]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getReplyingTo: getReplyingToStub,
        getAllResponses: getAllResponsesStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getPost: getPostStub,
        getAllPostLikers: getAllPostLikersStub,
        getBookmarks: getBookmarksStub,
      });
      const expected = {
        imageUrl: 'url',
        initials: 'JS',
        loggedUser: 'john',
        fullName: userDetails.name,
        post: {
          repostCount: 0,
          hashtags: ['html'],
          initials: 'JS',
          isBookmarked: false,
          isDeletable: true,
          imageUrl: 'url',
          isLiked: false,
          likedUsers: [],
          mentions: [],
          message: 'hello',
          name: 'john samuel',
          postId: 1,
          postedAt: '2020-08-03',
          responseCount: 1,
          userId: 1,
          username: 'john',
          isReposted: false,
          dob: '2020-08-03',
          joinedDate: '2020-08-03',
        },
        responses: [
          {
            repostCount: 0,
            hashtags: ['html'],
            initials: 'JS',
            isBookmarked: false,
            imageUrl: 'url',
            isDeletable: true,
            isLiked: false,
            likedUsers: [],
            mentions: [],
            message: 'response',
            name: 'john samuel',
            postId: 2,
            postedAt: '2020-08-03',
            responseCount: 1,
            userId: 1,
            username: 'john',
            dob: '2020-08-03',
            joinedDate: '2020-08-03',
            isReposted: false,
          },
        ],
      };
      const actual = await app.getPostDetails(postId);
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getPostStub, postId);
      sinon.assert.calledTwice(getAllPostLikersStub);
    });

    it('should give error when post table not found', async () => {
      const getPostStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        getPost: getPostStub,
      });
      try {
        await app.getPostDetails(postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getPostStub, postId);
      }
    });
  });

  describe('getUserFeed()', () => {
    it('should resolve to the feeds posts of user', async () => {
      const getFollowingStub = sinon
        .stub()
        .resolves([{ userId: 2, username: 'Ram' }]);
      const getUserPostsStub = sinon.stub().resolves(createDummyPosts());
      const getBookmarksStub = sinon.stub().resolves([]);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllRepostsStub = sinon.stub().resolves([]);
      const getRepostsByUserIdStub = sinon.stub().resolves(reposts);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getReplyingTo: getReplyingToStub,
        getAllResponses: getAllResponsesStub,
        getFollowing: getFollowingStub,
        getUserPosts: getUserPostsStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
        getRepostsByUserId: getRepostsByUserIdStub,
      });
      const expected = {
        imageUrl: 'url',
        initials: 'JS',
        loggedUser: 'john',
        fullName: userDetails.name,
        posts: [
          {
            repostCount: 0,
            dob: '2020-08-03',
            hashtags: ['html'],
            imageUrl: 'url',
            initials: 'JS',
            isBookmarked: false,
            isDeletable: true,
            isLiked: true,
            joinedDate: '2020-08-03',
            likedUsers: [{ userId: 1 }],
            mentions: [],
            message: 'post',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            responseCount: 1,
            userId: 1,
            isReposted: false,
            username: 'john',
          },
          {
            isReposted: false,
            repostCount: 0,
            dob: '2020-08-03',
            hashtags: ['html'],
            imageUrl: 'url',
            initials: 'JS',
            isBookmarked: false,
            isDeletable: true,
            isLiked: true,
            joinedDate: '2020-08-03',
            likedUsers: [{ userId: 1 }],
            mentions: [],
            message: 'repost',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            repostedBy: 'Ram',
            responseCount: 1,
            userId: 1,
            username: 'john',
          },
          {
            isReposted: false,
            dob: '2020-08-03',
            repostCount: 0,
            hashtags: ['html'],
            imageUrl: 'url',
            initials: 'JS',
            isBookmarked: false,
            isDeletable: true,
            isLiked: true,
            joinedDate: '2020-08-03',
            likedUsers: [{ userId: 1 }],
            mentions: [],
            message: 'post',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            responseCount: 1,
            userId: 1,
            username: 'john',
          },
          {
            isReposted: false,
            dob: '2020-08-03',
            hashtags: ['html'],
            repostCount: 0,
            imageUrl: 'url',
            initials: 'JS',
            isBookmarked: false,
            isDeletable: true,
            isLiked: true,
            joinedDate: '2020-08-03',
            likedUsers: [{ userId: 1 }],
            mentions: [],
            message: 'repost',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            repostedBy: 'john',
            responseCount: 1,
            userId: 1,
            username: 'john',
          },
        ],
      };
      const actual = await app.getUserFeed();
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getFollowingStub, userId);
      sinon.assert.calledTwice(getUserPostsStub);
    });

    it('should reject any error', async () => {
      const getFollowingStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getFollowing: getFollowingStub });
      try {
        await app.getUserFeed();
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getFollowingStub, userId);
      }
    });
  });

  describe('savePost()', () => {
    it('should save a post', async () => {
      const savePostStub = sinon.stub().resolves(null);
      const app = createApp({ savePost: savePostStub });
      const content = 'hello';
      assert.isNumber(await app.savePost(content));
      sinon.assert.calledOnce(savePostStub);
    });

    it('should reject any error', async () => {
      const savePostStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ savePost: savePostStub });
      const content = 'hello';
      try {
        await app.savePost(content);
      } catch (err) {
        sinon.assert.calledOnce(savePostStub);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('toggleLikeOnPost()', () => {
    it('should unlike a post when it is liked', async () => {
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const likePostStub = sinon.stub().resolves(null);
      const unlikePostStub = sinon.stub().resolves(null);
      const app = createApp({
        getAllPostLikers: getAllPostLikersStub,
        likePost: likePostStub,
        unlikePost: unlikePostStub,
      });
      assert.isNull(await app.toggleLikeOnPost(postId));
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      sinon.assert.calledOnceWithExactly(unlikePostStub, postId, userId);
      sinon.assert.notCalled(likePostStub);
    });

    it('should like a post when it is not liked', async () => {
      const getAllPostLikersStub = sinon.stub().resolves([{ userId: 3 }]);
      const likePostStub = sinon.stub().resolves(null);
      const unlikePostStub = sinon.stub().resolves(null);
      const app = createApp({
        getAllPostLikers: getAllPostLikersStub,
        likePost: likePostStub,
        unlikePost: unlikePostStub,
      });
      assert.isNull(await app.toggleLikeOnPost(postId));
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      sinon.assert.calledOnceWithExactly(likePostStub, postId, userId);
      sinon.assert.notCalled(unlikePostStub);
    });

    it('should reject any errors', async () => {
      const getAllPostLikersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        getAllPostLikers: getAllPostLikersStub,
      });
      try {
        await app.toggleLikeOnPost(postId);
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('toggleFollowingAUser()', () => {
    const otherUserId = 2;

    it('should unFollow are user when being followed', async () => {
      const getIdByUsernameStub = sinon
        .stub()
        .resolves({ userId: otherUserId });
      const getFollowersStub = sinon.stub().resolves([{ userId }]);
      const unFollowUserStub = sinon.stub().resolves(null);
      const followUserStub = sinon.stub().resolves(null);
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
        getFollowers: getFollowersStub,
        unFollowUser: unFollowUserStub,
        followUser: followUserStub,
      });
      assert.isNull(await app.toggleFollowingAUser('naveen'));
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      sinon.assert.calledOnceWithExactly(getFollowersStub, otherUserId);
      sinon.assert.calledOnceWithExactly(unFollowUserStub, userId, otherUserId);
      sinon.assert.notCalled(followUserStub);
    });

    it('should follow are user when not being followed', async () => {
      const getIdByUsernameStub = sinon
        .stub()
        .resolves({ userId: otherUserId });
      const getFollowersStub = sinon.stub().resolves([{ userId: 3 }]);
      const unFollowUserStub = sinon.stub().resolves(null);
      const followUserStub = sinon.stub().resolves(null);
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
        getFollowers: getFollowersStub,
        unFollowUser: unFollowUserStub,
        followUser: followUserStub,
      });
      assert.isNull(await app.toggleFollowingAUser('naveen'));
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      sinon.assert.calledOnceWithExactly(getFollowersStub, otherUserId);
      sinon.assert.calledOnceWithExactly(followUserStub, userId, otherUserId);
      sinon.assert.notCalled(unFollowUserStub);
    });

    it('should reject any error', async () => {
      const getIdByUsernameStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
      });
      try {
        await app.toggleFollowingAUser('naveen');
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('deletePost()', () => {
    it('should delete a post', async () => {
      const removePostStub = sinon.stub().resolves(null);
      const app = createApp({ removePost: removePostStub });
      assert.isNull(await app.deletePost(postId));
      sinon.assert.alwaysCalledWithExactly(removePostStub, postId);
    });

    it('should reject any error', async () => {
      const removePostStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ removePost: removePostStub });
      try {
        await app.deletePost(postId);
      } catch (err) {
        sinon.assert.alwaysCalledWithExactly(removePostStub, postId);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('isUsernameAvailable()', () => {
    it('should return true when username is available', async () => {
      const getIdByUsernameStub = sinon.stub().resolves();
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      assert.isTrue(await app.isUsernameAvailable('naveen'));
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
    });

    it('should return false when username is not available', async () => {
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      assert.isFalse(await app.isUsernameAvailable('naveen'));
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
    });

    it('should reject any error', async () => {
      const getIdByUsernameStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      try {
        await app.isUsernameAvailable('naveen');
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      }
    });
  });

  describe('saveUser()', () => {
    it('should save a user and return the userId', async () => {
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const saveUserStub = sinon.stub().resolves();
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
        saveUser: saveUserStub,
      });
      assert.deepStrictEqual(await app.saveUser(userDetails), { userId });
      sinon.assert.calledOnceWithExactly(saveUserStub, userDetails);
      const username = userDetails.username;
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, username);
    });

    it('should reject any error', async () => {
      const saveUserStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ saveUser: saveUserStub });
      try {
        await app.saveUser(userDetails);
      } catch (err) {
        sinon.assert.calledOnceWithExactly(saveUserStub, userDetails);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('getProfilePosts()', () => {
    it('should give both liked and posted posts of given user', async () => {
      const getUserPostsStub = sinon.stub().resolves(createDummyPosts());
      const getLikedPostsStub = sinon.stub().resolves(createDummyPosts());
      const getBookmarksStub = sinon.stub().resolves([]);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getUserResponsesStub = sinon.stub().resolves([]);
      const getRepostsByUserIdStub = sinon.stub().resolves([]);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getUserResponses: getUserResponsesStub,
        getAllResponses: getAllResponsesStub,
        getAllPostLikers: getAllPostLikersStub,
        getUserPosts: getUserPostsStub,
        getLikedPosts: getLikedPostsStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
        getReplyingTo: getReplyingToStub,
        getRepostsByUserId: getRepostsByUserIdStub,
      });
      const actual = await app.getProfilePosts({ userId });
      const expected = {
        likedPosts: [
          {
            repostCount: 0,
            ...userDetails,
            initials: 'JS',
            isDeletable: true,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            responseCount: 1,
            message: 'post',
            postId: 1,
            postedAt: '2020-08-03',
            isBookmarked: false,
            hashtags: ['html'],
            mentions: [],
            isReposted: false,
          },
        ],
        posts: [
          {
            ...userDetails,
            repostCount: 0,
            initials: 'JS',
            isDeletable: true,
            responseCount: 1,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            message: 'post',
            postId: 1,
            postedAt: '2020-08-03',
            isBookmarked: false,
            hashtags: ['html'],
            mentions: [],
            isReposted: false,
          },
        ],
        responsePosts: [],
      };
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getUserPostsStub, userId);
      sinon.assert.calledOnceWithExactly(getLikedPostsStub, userId);
      sinon.assert.calledTwice(getAllPostLikersStub);
    });

    it('should handle any error', async () => {
      const getUserPostsStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getUserPosts: getUserPostsStub });
      try {
        await app.getProfilePosts({ userId });
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getUserPostsStub, userId);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('getUserProfile()', () => {
    it('should reject any error', async () => {
      const getIdByUsernameStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      try {
        await app.getUserProfile('naveen');
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      }
    });

    it('should resolve to user profile', async () => {
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const getBookmarksStub = sinon.stub().resolves([]);
      const getUserPostsStub = sinon.stub().resolves(createDummyPosts());
      const getLikedPostsStub = sinon.stub().resolves([]);
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getFollowersStub = sinon.stub().resolves([]);
      const getFollowingStub = sinon.stub().resolves([]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getUserResponsesStub = sinon.stub().resolves([]);
      const getRepostsByUserIdStub = sinon.stub().resolves([]);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getRepostsByUserId: getRepostsByUserIdStub,
        getUserResponses: getUserResponsesStub,
        getReplyingTo: getReplyingToStub,
        getAllResponses: getAllResponsesStub,
        getUserDetails: getUserDetailsStub,
        getAllPostLikers: getAllPostLikersStub,
        getUserPosts: getUserPostsStub,
        getLikedPosts: getLikedPostsStub,
        getIdByUsername: getIdByUsernameStub,
        getFollowers: getFollowersStub,
        getFollowing: getFollowingStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
      });
      const actual = await app.getUserProfile(userDetails.username);
      const expected = {
        followers: [],
        following: [],
        initials: 'JS',
        imageUrl: 'url',
        isFollowing: false,
        likedPosts: [],
        loggedUser: 'john',
        fullName: userDetails.name,
        dob: '2020-08-03',
        joinedDate: '2020-08-03',
        name: 'john samuel',
        username: 'john',
        profileUrl: 'url',
        userId,
        responsePosts: [],
        posts: [
          {
            imageUrl: 'url',
            responseCount: 1,
            repostCount: 0,
            initials: 'JS',
            isDeletable: true,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            message: 'post',
            postId: 1,
            postedAt: '2020-08-03',
            isBookmarked: false,
            hashtags: ['html'],
            mentions: [],
            name: 'john samuel',
            username: 'john',
            userId,
            dob: '2020-08-03',
            joinedDate: '2020-08-03',
            isReposted: false,
          },
        ],
      };
      const username = userDetails.username;
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, userId);
      sinon.assert.calledOnceWithExactly(getUserPostsStub, userId);
      sinon.assert.calledOnceWithExactly(getLikedPostsStub, userId);
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, username);
      sinon.assert.calledOnceWithExactly(getFollowersStub, userId);
      sinon.assert.calledOnceWithExactly(getFollowingStub, userId);
    });
  });

  describe('getSearchSuggestions()', () => {
    it('should resolve to searched user suggestions', async () => {
      const getMatchingUsersStub = sinon.stub().resolves([userDetails]);
      const app = createApp({ getMatchingUsers: getMatchingUsersStub });
      const actual = await app.getSearchSuggestions('@john');
      const expected = [{ ...userDetails, initials: 'JS' }];
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getMatchingUsersStub, 'john');
    });

    it('should give hashtag suggestions', async () => {
      const getMatchingHashtagsStub = sinon
        .stub()
        .resolves([{ hashtag: 'html' }]);
      const app = createApp({ getMatchingHashtags: getMatchingHashtagsStub });
      const actual = await app.getSearchSuggestions('#ht');
      const expected = ['html'];
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getMatchingHashtagsStub, 'ht');
    });

    it('should reject any error', async () => {
      const getMatchingUsersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getMatchingUsers: getMatchingUsersStub });
      try {
        await app.getSearchSuggestions('john');
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getMatchingUsersStub, 'john');
      }
    });
  });

  describe('getFollowingList()', () => {
    it('should return the list of following of a user', async () => {
      const getFollowersStub = sinon.stub().resolves([]);
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getFollowingStub = sinon.stub().resolves([userDetails]);
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
        getUserDetails: getUserDetailsStub,
        getFollowing: getFollowingStub,
        getFollowers: getFollowersStub,
      });
      const actual = await app.getFollowingList('naveen');
      const expected = {
        followingList: [
          {
            initials: 'JS',
            isFollowingMe: false,
            name: 'john samuel',
            userId: 1,
            username: 'john',
            dob: '2020-08-03',
            joinedDate: '2020-08-03',
            imageUrl: 'url',
          },
        ],
        imageUrl: 'url',
        initials: 'JS',
        loggedUser: 'john',
        fullName: userDetails.name,
        profile: {
          imageUrl: 'url',
          initials: 'JS',
          isFollowingMe: false,
          name: 'john samuel',
          userId: 1,
          username: 'john',
          dob: '2020-08-03',
          joinedDate: '2020-08-03',
        },
      };
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
      sinon.assert.calledOnceWithExactly(getFollowingStub, userId);
    });

    it('should reject any error', async () => {
      const getIdByUsernameStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      try {
        await app.getFollowingList('naveen');
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('getFollowersList()', () => {
    it('should return the list of followers of a user', async () => {
      const getFollowersStub = sinon.stub().resolves([userDetails]);
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
        getUserDetails: getUserDetailsStub,
        getFollowers: getFollowersStub,
      });
      const actual = await app.getFollowersList('naveen');
      const expected = {
        followersList: [
          {
            initials: 'JS',
            isFollowingMe: true,
            name: 'john samuel',
            userId: 1,
            username: 'john',
            dob: '2020-08-03',
            imageUrl: 'url',
            joinedDate: '2020-08-03',
          },
        ],
        loggedUser: 'john',
        imageUrl: 'url',
        initials: 'JS',
        fullName: userDetails.name,
        profile: {
          initials: 'JS',
          imageUrl: 'url',
          isFollowingMe: true,
          name: 'john samuel',
          userId: 1,
          username: 'john',
          dob: '2020-08-03',
          joinedDate: '2020-08-03',
        },
      };
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
      sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
    });

    it('should reject any error', async () => {
      const getIdByUsernameStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getIdByUsername: getIdByUsernameStub });
      try {
        await app.getFollowersList('naveen');
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('getUserId()', () => {
    it('should resolve to the userId based on github username', async () => {
      const getIdByGithubUsernameStub = sinon.stub().resolves({ userId });
      const app = createApp({
        getIdByGithubUsername: getIdByGithubUsernameStub,
      });
      assert.deepStrictEqual(await app.getUserId('naveen'), { userId });
      sinon.assert.calledOnceWithExactly(getIdByGithubUsernameStub, 'naveen');
    });

    it('should reject any error', async () => {
      const getIdByGithubUsernameStub = sinon
        .stub()
        .rejects(expectedTableError);
      const app = createApp({
        getIdByGithubUsername: getIdByGithubUsernameStub,
      });
      try {
        await app.getUserId('naveen');
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getIdByGithubUsernameStub, 'naveen');
      }
    });
  });

  describe('getPostLikers()', () => {
    it('should give users who liked a post based on postId', async () => {
      const getAllPostLikersStub = sinon.stub().resolves([userDetails]);
      const getFollowersStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllPostLikers: getAllPostLikersStub,
        getFollowers: getFollowersStub,
      });
      const actual = await app.getPostLikers(postId);
      const expected = {
        likers: [
          {
            ...userDetails,
            isFollowingMe: false,
          },
        ],
        imageUrl: 'url',
        initials: 'JS',
        loggedUser: userDetails.username,
        fullName: userDetails.name,
        postId,
      };
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getFollowersStub, userId);
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
    });

    it('should give error when posts table not found', async () => {
      const getAllPostLikersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getAllPostLikers: getAllPostLikersStub });
      try {
        await app.getPostLikers(postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      }
    });
  });

  describe('getValidMentions()', () => {
    it('should give list of valid users mentioned in post', async () => {
      const getIdByUsernameStub = sinon.stub().resolves({ userId });
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
      });
      assert.deepStrictEqual(await app.getValidMentions('hii @naveen'), [
        'naveen',
      ]);
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
    });

    it('should give empty list when there is no valid users mentioned in post', async () => {
      const getIdByUsernameStub = sinon.stub().resolves({});
      const app = createApp({
        getIdByUsername: getIdByUsernameStub,
      });
      assert.deepStrictEqual(await app.getValidMentions('hii @naveen'), []);
      sinon.assert.calledOnceWithExactly(getIdByUsernameStub, 'naveen');
    });
  });

  describe('getHashtagRelatedPosts', () => {
    it('should give all posts with the given hashtag', async () => {
      const post = {
        postId,
        postedAt: '2020-08-03',
        message: 'hi #html',
        ...userDetails,
      };
      const getPostsByHashtagStub = sinon.stub().resolves([post]);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getBookmarksStub = sinon.stub().resolves([]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getReplyingTo: getReplyingToStub,
        getAllResponses: getAllResponsesStub,
        getPostsByHashtag: getPostsByHashtagStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
      });
      const expected = {
        posts: [
          {
            initials: 'JS',
            repostCount: 0,
            responseCount: 1,
            isDeletable: true,
            isLiked: true,
            isFollowingMe: false,
            likedUsers: [{ userId: 1 }],
            message: 'hi #html',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            isBookmarked: false,
            userId: 1,
            username: 'john',
            mentions: [],
            hashtags: ['html'],
            dob: '2020-08-03',
            joinedDate: '2020-08-03',
            imageUrl: 'url',
            isReposted: false,
          },
        ],
        loggedUser: userDetails.username,
        hashtag: 'html',
        imageUrl: 'url',
        initials: 'JS',
        fullName: userDetails.name,
      };
      const actual = await app.getHashtagRelatedPosts('html');
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getPostsByHashtagStub, 'html');
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
      sinon.assert.calledOnceWithExactly(getHashtagsByPostIdStub, postId);
    });
  });

  describe('getBookmarks()', () => {
    it('should give list of bookmarked posts of user', async () => {
      const getBookmarksStub = sinon.stub().resolves(createDummyPosts());
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getReplyingToStub = sinon.stub().resolves();
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getReplyingTo: getReplyingToStub,
        getAllResponses: getAllResponsesStub,
        getBookmarks: getBookmarksStub,
        getUserDetails: getUserDetailsStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
      });
      const expected = {
        loggedUser: 'john',
        imageUrl: 'url',
        initials: 'JS',
        fullName: userDetails.name,
        posts: [
          {
            repostCount: 0,
            imageUrl: 'url',
            hashtags: ['html'],
            initials: 'JS',
            isDeletable: true,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            responseCount: 1,
            isFollowingMe: false,
            mentions: [],
            message: 'post',
            name: 'john samuel',
            postId: 1,
            postedAt: '2020-08-03',
            isBookmarked: true,
            userId: 1,
            username: 'john',
            dob: '2020-08-03',
            joinedDate: '2020-08-03',
            isReposted: false,
          },
        ],
      };
      assert.deepStrictEqual(await app.getBookmarks(), expected);
      sinon.assert.calledTwice(getBookmarksStub);
    });

    it('should give empty list when no posts are bookmarked', async () => {
      const getBookmarksStub = sinon.stub().resolves([]);
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const app = createApp({
        getBookmarks: getBookmarksStub,
        getUserDetails: getUserDetailsStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
      });
      const expected = {
        posts: [],
        loggedUser: 'john',
        imageUrl: 'url',
        initials: 'JS',
        fullName: userDetails.name,
      };
      assert.deepStrictEqual(await app.getBookmarks(), expected);
      sinon.assert.calledOnce(getBookmarksStub);
    });

    it('should reject any error', async () => {
      const getBookmarksStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getBookmarks: getBookmarksStub });
      try {
        await app.getBookmarks();
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnce(getBookmarksStub);
      }
    });
  });

  describe('isBookmarked()', () => {
    it('should give true if bookmarked by user', async () => {
      const getBookmarksStub = sinon.stub().resolves(createDummyPosts());
      const app = createApp({ getBookmarks: getBookmarksStub });
      assert.isTrue(await app.isBookmarked(postId));
      sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
    });

    it('should give false if not bookmarked by user', async () => {
      const getBookmarksStub = sinon.stub().resolves([]);
      const app = createApp({ getBookmarks: getBookmarksStub });
      assert.isFalse(await app.isBookmarked(postId));
      sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
    });

    it('should reject any error', async () => {
      const getBookmarksStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getBookmarks: getBookmarksStub });
      try {
        await app.isBookmarked(postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
      }
    });
  });

  describe('toggleBookmarkOnPost()', () => {
    it('should add post to bookmarks if it is not bookmarked', async () => {
      const getBookmarksStub = sinon.stub().resolves([]);
      const addBookmarkStub = sinon.stub().resolves();
      const app = createApp({
        getBookmarks: getBookmarksStub,
        addBookmark: addBookmarkStub,
      });
      assert.isUndefined(await app.toggleBookmarkOnPost(postId));
      sinon.assert.calledOnceWithExactly(addBookmarkStub, postId, userId);
      sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
    });

    it('should remove post from bookmarks if it is bookmarked', async () => {
      const getBookmarksStub = sinon.stub().resolves(createDummyPosts());
      const removeBookmarkStub = sinon.stub().resolves();
      const app = createApp({
        getBookmarks: getBookmarksStub,
        removeBookmark: removeBookmarkStub,
      });
      assert.isUndefined(await app.toggleBookmarkOnPost(postId));
      sinon.assert.calledOnceWithExactly(removeBookmarkStub, postId, userId);
      sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
    });

    it('should reject any error', async () => {
      const getBookmarksStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getBookmarks: getBookmarksStub });
      try {
        await app.toggleBookmarkOnPost(postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getBookmarksStub, userId);
      }
    });
  });

  describe('saveHashtag()', () => {
    it('should save the hashtag to db', async () => {
      const addHashtagStub = sinon.stub().resolves(null);
      const app = createApp({ addHashtag: addHashtagStub });
      await app.saveHashTag('#html', postId);
      sinon.assert.calledOnceWithExactly(addHashtagStub, 'html', postId);
    });

    it('should give error when hashtag table not found', async () => {
      const addHashtagStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ addHashtag: addHashtagStub });
      try {
        await app.saveHashTag('#html', postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(addHashtagStub, 'html', postId);
      }
    });
  });

  describe('saveResponse()', () => {
    it('should save a response', async () => {
      const savePostStub = sinon.stub().resolves(null);
      const addResponseStub = sinon.stub().resolves(null);
      const app = createApp({
        savePost: savePostStub,
        addResponse: addResponseStub,
      });
      const content = 'hello';
      assert.isNull(await app.saveResponse(content, postId));
      sinon.assert.calledOnce(savePostStub);
      sinon.assert.calledOnce(addResponseStub);
    });

    it('should give error when table not found', async () => {
      const savePostStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ savePost: savePostStub });
      const content = 'hello';
      try {
        await app.saveResponse(content, postId);
      } catch (err) {
        sinon.assert.calledOnce(savePostStub);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });

  describe('getUserResponsesWithPosts()', () => {
    it('should give me all the responses and posts in order', async () => {
      const [dummyPost] = createDummyPosts();
      const getUserResponsesStub = sinon.stub().resolves([
        { postId, responseId: 2 },
        { postId, responseId: 3 },
      ]);
      const getPostStub = sinon.stub().resolves(dummyPost);
      const getBookmarksStub = sinon.stub().resolves([]);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const getHashtagsByPostIdStub = sinon.stub().resolves(hashtags);
      const getAllResponsesStub = sinon.stub().resolves(responses);
      const getReplyingToStub = sinon.stub().resolves({ username: 'ram' });
      const getAllRepostsStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getAllPostLikers: getAllPostLikersStub,
        getHashtagsByPostId: getHashtagsByPostIdStub,
        getBookmarks: getBookmarksStub,
        getAllResponses: getAllResponsesStub,
        getReplyingTo: getReplyingToStub,
        getUserResponses: getUserResponsesStub,
        getPost: getPostStub,
      });
      const expected = [
        {
          childPost: true,
          dob: '2020-08-03',
          hashtags: ['html'],
          imageUrl: 'url',
          repostCount: 0,
          initials: 'JS',
          isBookmarked: false,
          isDeletable: true,
          isFollowingMe: false,
          isLiked: true,
          joinedDate: '2020-08-03',
          likedUsers: [{ userId: 1 }],
          mentions: [],
          message: 'post',
          name: 'john samuel',
          parentPost: true,
          postId: 1,
          postedAt: '2020-08-03',
          replyingTo: 'ram',
          responseCount: 1,
          userId: 1,
          username: 'john',
          isReposted: false,
        },
        {
          repostCount: 0,
          childPost: true,
          dob: '2020-08-03',
          hashtags: ['html'],
          imageUrl: 'url',
          initials: 'JS',
          isBookmarked: false,
          isDeletable: true,
          isFollowingMe: false,
          isLiked: true,
          joinedDate: '2020-08-03',
          likedUsers: [{ userId: 1 }],
          mentions: [],
          message: 'post',
          name: 'john samuel',
          parentPost: true,
          postId: 1,
          postedAt: '2020-08-03',
          replyingTo: 'ram',
          responseCount: 1,
          userId: 1,
          username: 'john',
          isReposted: false,
        },
        {
          repostCount: 0,
          childPost: true,
          dob: '2020-08-03',
          hashtags: ['html'],
          imageUrl: 'url',
          initials: 'JS',
          isBookmarked: false,
          isDeletable: true,
          isFollowingMe: false,
          isLiked: true,
          joinedDate: '2020-08-03',
          likedUsers: [{ userId: 1 }],
          mentions: [],
          message: 'post',
          name: 'john samuel',
          parentPost: true,
          postId: 1,
          postedAt: '2020-08-03',
          replyingTo: 'ram',
          responseCount: 1,
          userId: 1,
          username: 'john',
          isReposted: false,
        },
      ];
      const actual = await app.getUserResponsesWithPosts(userId);
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnce(getUserResponsesStub);
      sinon.assert.calledThrice(getAllPostLikersStub);
      sinon.assert.calledThrice(getReplyingToStub);
      sinon.assert.calledThrice(getHashtagsByPostIdStub);
      sinon.assert.calledThrice(getBookmarksStub);
      sinon.assert.calledThrice(getReplyingToStub);
      sinon.assert.callCount(getPostStub, 4);
    });
    it('should reject any error', async () => {
      const getUserResponsesStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getUserResponses: getUserResponsesStub });
      try {
        await app.getUserResponsesWithPosts(userId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getUserResponsesStub, userId);
      }
    });
  });

  describe('updateUserDetails()', () => {
    const updateDetails = {
      name: 'newName',
      username: 'newUsername',
      dob: '2020-08-03',
      bio: 'newBio',
    };
    it('should update user details', async () => {
      const updateUserDetailsStub = sinon.stub().resolves();
      const app = createApp({
        updateUserDetails: updateUserDetailsStub,
      });
      assert.isUndefined(await app.updateUserDetails(updateDetails));
      sinon.assert.calledOnceWithExactly(
        updateUserDetailsStub,
        userId,
        updateDetails
      );
    });

    it('should reject any error', async () => {
      const updateUserDetailsStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        updateUserDetails: updateUserDetailsStub,
      });
      try {
        await app.updateUserDetails(updateDetails);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(
          updateUserDetailsStub,
          userId,
          updateDetails
        );
      }
    });
  });

  describe('toggleRepost()', () => {
    it('should add the repost to reposts table when the user is not reposted that', async () => {
      const getAllRepostsStub = sinon.stub().resolves([]);
      const undoRepostStub = sinon.stub().resolves();
      const repostStub = sinon.stub().resolves();
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        undoRepost: undoRepostStub,
        repost: repostStub,
      });
      assert.isUndefined(await app.toggleRepost(postId));
      sinon.assert.calledOnceWithExactly(getAllRepostsStub, postId);
      sinon.assert.calledOnceWithExactly(repostStub, postId, userId);
    });

    it('should remove the repost from reposts table when the user is  reposted that', async () => {
      const getAllRepostsStub = sinon.stub().resolves([{ userId, postId }]);
      const undoRepostStub = sinon.stub().resolves();
      const repostStub = sinon.stub().resolves();
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        undoRepost: undoRepostStub,
        repost: repostStub,
      });
      assert.isUndefined(await app.toggleRepost(postId));
      sinon.assert.calledOnceWithExactly(getAllRepostsStub, postId);
      sinon.assert.calledOnceWithExactly(undoRepostStub, postId, userId);
    });
  });

  describe('getRepostedUsers()', () => {
    it('should give users who liked a post based on postId', async () => {
      const getAllRepostsStub = sinon.stub().resolves([userDetails]);
      const getFollowersStub = sinon.stub().resolves([]);
      const app = createApp({
        getAllReposts: getAllRepostsStub,
        getFollowers: getFollowersStub,
      });
      const actual = await app.getRepostedUsers(postId);
      const expected = {
        repostedUsers: [
          {
            ...userDetails,
            isFollowingMe: false,
          },
        ],
        imageUrl: 'url',
        initials: 'JS',
        loggedUser: userDetails.username,
        postId,
        fullName: userDetails.name,
      };
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getFollowersStub, userId);
      sinon.assert.calledOnceWithExactly(getAllRepostsStub, postId);
    });

    it('should give error when posts table not found', async () => {
      const getAllRepostsStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ getAllPostLikers: getAllRepostsStub });
      try {
        await app.getPostLikers(postId);
      } catch (err) {
        assert.deepStrictEqual(err, expectedTableError);
        sinon.assert.calledOnceWithExactly(getAllRepostsStub, postId);
      }
    });
  });

  describe('updateUserList()', () => {
    it('should update given list of users', async () => {
      const getFollowersStub = sinon.stub().resolves([]);
      const app = createApp({
        getFollowers: getFollowersStub,
      });
      const actual = await app.updateUsersList([userDetails]);
      const expected = [
        {
          initials: 'JS',
          isFollowingMe: false,
          name: 'john samuel',
          userId: 1,
          username: 'john',
          dob: '2020-08-03',
          joinedDate: '2020-08-03',
          imageUrl: 'url',
        },
      ];
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getFollowersStub, userId);
    });

    it('should reject any errors', async () => {
      const getFollowersStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({
        getFollowers: getFollowersStub,
      });
      try {
        await app.updateUsersList([userDetails]);
      } catch (err) {
        sinon.assert.calledOnceWithExactly(getFollowersStub, userId);
        assert.deepStrictEqual(err, expectedTableError);
      }
    });
  });
});
