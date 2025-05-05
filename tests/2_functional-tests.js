const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;
  const testBoard = 'testboard';

  // Create a new thread before all tests
  before(function(done) {
    chai.request(server)
      .post(`/api/threads/${testBoard}`)
      .send({
        text: 'Test Thread',
        delete_password: 'password123'
      })
      .end(function(err, res) {
        if (err) done(err);
        
        // Get the thread ID
        chai.request(server)
          .get(`/api/threads/${testBoard}`)
          .end(function(err, res) {
            if (err) done(err);
            testThreadId = res.body[0]._id;
            done();
          });
      });
  });

  suite('API ROUTING FOR /api/threads/:board', function() {
    let newThreadId;
    
    test('POST /api/threads/:board', function(done) {
      chai.request(server)
        .post(`/api/threads/${testBoard}`)
        .send({
          text: 'Another Test Thread',
          delete_password: 'password123'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('GET /api/threads/:board', function(done) {
      chai.request(server)
        .get(`/api/threads/${testBoard}`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          newThreadId = res.body[0]._id;
          done();
        });
    });

    test('PUT /api/threads/:board', function(done) {
      chai.request(server)
        .put(`/api/threads/${testBoard}`)
        .send({ thread_id: newThreadId })
        .end(function(err, res) {
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('DELETE /api/threads/:board with incorrect password', function(done) {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          thread_id: newThreadId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE /api/threads/:board with correct password', function(done) {
      chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
          thread_id: newThreadId,
          delete_password: 'password123'
        })
        .end(function(err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    
    test('POST /api/replies/:board', function(done) {
      chai.request(server)
        .post(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          text: 'Test Reply',
          delete_password: 'password123'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('GET /api/replies/:board', function(done) {
      chai.request(server)
        .get(`/api/replies/${testBoard}`)
        .query({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          if (res.body.replies.length > 0) {
            testReplyId = res.body.replies[0]._id;
          }
          done();
        });
    });

    test('PUT /api/replies/:board', function(done) {
      chai.request(server)
        .put(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId
        })
        .end(function(err, res) {
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('DELETE /api/replies/:board with incorrect password', function(done) {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: 'wrongpassword'
        })
        .end(function(err, res) {
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE /api/replies/:board with correct password', function(done) {
      chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
          thread_id: testThreadId,
          reply_id: testReplyId,
          delete_password: 'password123'
        })
        .end(function(err, res) {
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});