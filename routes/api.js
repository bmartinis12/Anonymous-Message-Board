'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const db = mongoose.connect(process.env.DB, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

const date = new Date()

const ReplySchema = new Schema({
  text: { type: String },
  delete_password: { type: String },
  created_on: { type: Date, default: date },
  bumped_on: { type: Date, default: date },
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new Schema({
  text: { type: String },
  delete_password: { type: String },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: date },
  bumped_on: { type: Date, default: date },
  replies: { type: [ReplySchema] }
});

const BoardSchema = new Schema({
  name: { type: String },
  threads: { type: [ThreadSchema] }
});

const Reply = mongoose.model("Reply", ReplySchema);
const Thread = mongoose.model("Thread", ThreadSchema);
const Board = mongoose.model("Board", BoardSchema);

module.exports = function(app) {

  app.route('/api/threads/:board')
    .post((req, res) => {
      const { text, delete_password } = req.body;
      let board = req.body.board;
      if(!board){
        board = req.params.board
      };
      const newThread = new Thread({
        text: text,
        delete_password: delete_password,
        replies: [],
      });
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          const newBoard = new Board({
            name: board,
            threads: [],
          });
          newBoard.threads.push(newThread);
          newBoard.save().then(data => {
            if(process.env.NODE_ENV == 'test'){
              console.log("Disable tests in .env to enable redirection.")
              return res.json(newThread);
            } else {
              return res.redirect("/b/" + board + "/");
            }
          });
        } else {
          boardData.threads.push(newThread);
          boardData.save().then(data => {
            if(process.env.NODE_ENV == 'test'){
              console.log("Disable tests in .env to enable redirection.")
              return res.json(newThread);
            } else {
              return res.redirect("/b/" + board + "/");
            }
          });
        };
      })
    })
    .get((req, res) => {
      const board = req.params.board;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.send("No board found");
        } else {
          let threads = boardData.threads.sort((x,y) => x.bumped_on - y.bumped_on);
          threads = threads.map(thread => {
            let threadToView = {
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: thread.replies.sort((a,b) => a.created_on - b.created_on).slice(0,3).map(reply => {
                let rep = {
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on
                }
              return rep
              }),
            }
            return threadToView;
          }).slice(0,10);
          res.send(threads);
        }
      });
    })
    .put((req, res) => {
      const { thread_id } = req.body;
      const board = req.params.board;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData || boardData == null){
          res.send("Error: Board Not Found");
        } else {
          let reportedThread = boardData.threads.id(thread_id);
          reportedThread.reported = true;
          boardData.save().then(data => {
            res.end("reported");
          });
        };
      });
    })
    .delete((req, res) => {
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.json({ error: "Board not found" });
        } else {
          let threadToDelete = boardData.threads.id(thread_id);
          if(threadToDelete.delete_password === delete_password){
            threadToDelete.deleteOne();
          } else {
            res.send("incorrect password");
            return;
          }
          boardData.save().then(data => {
            res.send("success");
          });
        }
      });
    });

  app.route('/api/replies/:board')
    .post((req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      const newReply = new Reply({
        text: text,
        delete_password: delete_password
      });
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.send("Error: Board not found");
        } else {
          const date = new Date();
          let threadToAddReply = boardData.threads.id(thread_id);
          threadToAddReply.replies.push(newReply);
          boardData.save().then(data => {
             if(process.env.NODE_ENV == 'test'){
              console.log("Disable tests in .env to enable redirection.")
              return res.json(newReply);
            } else {
              return res.redirect("/b/" + board + "/" + thread_id);
            }
          });
        }
      });
    })
    .get((req, res) => {
      const board = req.params.board;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.send("Error: No board found");
        } else {
          const thread = boardData.threads.id(req.query.thread_id);
          let threadToView = {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies.map(reply => {
              return {
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on
              }
            })
          }
          res.send(threadToView);
        }
      });
    })
    .put((req, res) => {
      const { thread_id, reply_id } = req.body;
      const board = req.params.board;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.send("Error: No board found");
        } else {
          let thread = boardData.threads.id(thread_id);
          let reply = thread.replies.id(reply_id);
          reply.reported = true;
          boardData.save().then(data => {
            res.end("reported");
          });
        }
      });
    })
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
      let check = 0;
      Board.findOne({ name: board }).then(boardData => {
        if(!boardData){
          res.send("Error: No board found");
        } else {
          let thread = boardData.threads.id(thread_id);
          let reply = thread.replies.id(reply_id);
          if(reply.delete_password === delete_password){
            //reply.deleteOne();
            reply.text = '[deleted]'
          } else {
            check = 1
            res.send("incorrect password");
          }
          boardData.save().then(data => {
            if(check == 0){
              res.send("success");
            }
          });
        }
      });
    });

};
