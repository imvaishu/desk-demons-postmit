const sinon = require('sinon');
const { assert } = require('chai');
const App = require('../lib/app');

describe('#App', () => {
  const userId = 1;
  const postId = 1;

  const userDetails = { name: 'john samuel', username: 'john', userId };

  const createDummyPosts = function () {
    return [
      { postId: postId, userId, postedAt: new Date().toJSON(), message: 'hi' },
    ];
  };

  const createApp = function (datastore) {
    const app = new App(datastore);
    app.userId = userId;
    app.username = userDetails.username;
    app.fullName = userDetails.name;
    return app;
  };
  // const [dummyPost] = createDummyPosts();

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

  describe('updatePost()', () => {
    it('should update the given posts with required details', async () => {
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const app = createApp({
        getUserDetails: getUserDetailsStub,
        getAllPostLikers: getAllPostLikersStub,
      });
      const expected = [
        {
          initials: 'JS',
          isDeletable: true,
          isLiked: true,
          likedUsers: [{ userId: 1 }],
          message: 'hi',
          name: 'john samuel',
          postId: 1,
          postedAt: 'a few seconds ago',
          userId: 1,
          username: 'john',
        },
      ];
      const actual = await app.updatePost(userId, createDummyPosts());
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
      sinon.assert.calledOnceWithExactly(getAllPostLikersStub, postId);
    });

    it('should reject any error', async () => {
      const getUserDetailsStub = sinon.stub().rejects(expectedUserDetailsError);
      const app = createApp({ getUserDetails: getUserDetailsStub });
      try {
        await app.updatePost(userId, createDummyPosts());
      } catch (err) {
        assert.deepStrictEqual(err, expectedUserDetailsError);
        sinon.assert.calledOnceWithExactly(getUserDetailsStub, userId);
      }
    });
  });

  describe('getUserFeed()', () => {
    it('should resolve to the feeds posts of user', async () => {
      const getFollowingStub = sinon.stub().resolves([{ userId: 2 }]);
      const getUserPostsStub = sinon.stub().resolves(createDummyPosts());
      const getUserDetailsStub = sinon.stub().resolves(userDetails);
      const getAllPostLikersStub = sinon.stub().resolves([{ userId }]);
      const app = createApp({
        getFollowing: getFollowingStub,
        getUserPosts: getUserPostsStub,
        getUserDetails: getUserDetailsStub,
        getAllPostLikers: getAllPostLikersStub,
      });
      const expected = {
        initials: 'JS',
        loggedUser: 'john',
        posts: [
          {
            initials: 'JS',
            isDeletable: true,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            message: 'hi',
            name: 'john samuel',
            postId: 1,
            postedAt: 'a few seconds ago',
            userId: 1,
            username: 'john',
          },
          {
            initials: 'JS',
            isDeletable: true,
            isLiked: true,
            likedUsers: [{ userId: 1 }],
            message: 'hi',
            name: 'john samuel',
            postId: 1,
            postedAt: 'Invalid date',
            userId: 1,
            username: 'john',
          },
        ],
      };
      const actual = await app.getUserFeed();
      assert.deepStrictEqual(actual, expected);
      sinon.assert.calledOnceWithExactly(getFollowingStub, userId);
      sinon.assert.calledTwice(getUserPostsStub);
      sinon.assert.calledTwice(getUserDetailsStub);
      sinon.assert.calledTwice(getAllPostLikersStub);
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
      assert.isNull(await app.savePost(content));
      sinon.assert.alwaysCalledWithExactly(savePostStub, userId, content);
    });

    it('should reject any error', async () => {
      const savePostStub = sinon.stub().rejects(expectedTableError);
      const app = createApp({ savePost: savePostStub });
      const content = 'hello';
      try {
        await app.savePost(content);
      } catch (err) {
        sinon.assert.alwaysCalledWithExactly(savePostStub, userId, content);
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
        assert.isTrue(await app.isUsernameAvailable('naveen'));
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
});
