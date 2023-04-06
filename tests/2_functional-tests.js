const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let testThread_id;
let testReply_id;
suite('Functional Tests', function() {
  test("Creating a new thread", (done) => {
    chai
      .request(server)
      .post("/api/threads/test-board")
      .set("content-type", "application/json")
      .send({ text: "test", delete_password: "test" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.text, "test");
        assert.equal(res.body.delete_password, "test");
        assert.equal(res.body.reported, false);
        testThread_id = res.body._id;
        done();
      });
  });
  test("View 10 most recent threads", (done) => {
    chai
      .request(server)
      .get("/api/threads/test-board")
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.exists(res.body[0], "Thread");
        assert.equal(res.body[0].text, "test");
        done();
      });
  });
  test("Deleting a thread with an incorrect password", (done) => {
    chai
      .request(server)
      .delete("/api/threads/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, delete_password: "wrong" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "incorrect password");
        done();
      });
  });
  test("Report a thread", (done) => {
    chai
      .request(server)
      .put("/api/threads/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "reported");
        done();
      });
  });
  test("Creating a new reply", (done) => {
    chai
      .request(server)
      .post("/api/replies/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, text: "test", delete_password: "test" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.text, "test")
        testReply_id = res.body._id;
        done();
      });
  });
  test("Viewing a single thread with all replies", (done) => {
    chai
      .request(server)
      .get("/api/replies/test-board")
      .set("content-type", "application/json")
      .query({ thread_id: testThread_id })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, testThread_id);
        assert.equal(res.body.text, "test");
        assert.equal(res.body.replies[0].text, "test");
        done();
      });
  });
  test("Deleting a reply with an incorrect password", (done) => {
    chai
      .request(server)
      .delete("/api/replies/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, reply_id: testReply_id, delete_password: "wrong" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "incorrect password");
        done();
      });
  });
  test("Reporting a reply", (done) => {
    chai
      .request(server)
      .put("/api/replies/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, reply_id: testReply_id })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "reported");
        done();
      });
  });
  test("Deleting a reply with the correct password", (done) => {
    chai
      .request(server)
      .delete("/api/replies/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, reply_id: testReply_id, delete_password: "test" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });
  test("Deleting a thread with the correct password", (done) => {
    chai
      .request(server)
      .delete("/api/threads/test-board")
      .set("content-type", "application/json")
      .send({ thread_id: testThread_id, delete_password: "test" })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, "success");
        done();
      });
  });
});
