'use strict';
const Thread = require('../models/Thread');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async function (req, res) {
      const { text, delete_password } = req.body;
      const board = req.params.board;

      try {
        const thread = new Thread({
          text,
          delete_password,
          board
        });
        await thread.save();
        res.redirect(`/b/${board}/`);
      } catch (err) {
        res.status(500).json({ error: 'Could not create thread' });
      }
    })
    .get(async function (req, res) {
      const board = req.params.board;
      
      try {
        const threads = await Thread.find({ board })
          .select('-reported -delete_password -replies.reported -replies.delete_password')
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        // Process each thread to include only the latest 3 replies
        const processedThreads = threads.map(thread => {
          const replyCount = thread.replies.length;
          return {
            ...thread,
            replycount: replyCount,
            replies: thread.replies.slice(-3)
          };
        });

        res.json(processedThreads);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch threads' });
      }
    })
    .delete(async function (req, res) {
      const { thread_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        if (!thread) return res.send('incorrect password');
        
        if (thread.delete_password === delete_password) {
          await Thread.findByIdAndDelete(thread_id);
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      } catch (err) {
        res.status(500).json({ error: 'Could not delete thread' });
      }
    })
    .put(async function (req, res) {
      const { thread_id } = req.body;
      try {
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).json({ error: 'Could not report thread' });
      }
    });

  app.route('/api/replies/:board')
    .post(async function (req, res) {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;

      try {
        const thread = await Thread.findById(thread_id);
        if (!thread) {
          return res.status(404).json({ error: 'Thread not found' });
        }

        // Create new reply with required fields
        const newReply = {
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        };

        // Add reply and update bumped_on date
        thread.replies.push(newReply);
        thread.bumped_on = newReply.created_on;
        
        await thread.save();
        res.redirect(`/b/${board}/${thread_id}`);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not create reply' });
      }
    })
    .get(async function (req, res) {
      const { thread_id } = req.query;
      try {
        const thread = await Thread.findById(thread_id)
          .select('-reported -delete_password -replies.delete_password -replies.reported');
        res.json(thread);
      } catch (err) {
        res.status(500).json({ error: 'Could not get replies' });
      }
    })
    .delete(async function (req, res) {
      const { thread_id, reply_id, delete_password } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        const reply = thread.replies.id(reply_id);
        
        if (reply.delete_password === delete_password) {
          reply.text = '[deleted]';
          await thread.save();
          res.send('success');
        } else {
          res.send('incorrect password');
        }
      } catch (err) {
        res.status(500).json({ error: 'Could not delete reply' });
      }
    })
    .put(async function (req, res) {
      const { thread_id, reply_id } = req.body;
      try {
        const thread = await Thread.findById(thread_id);
        thread.replies.id(reply_id).reported = true;
        await thread.save();
        res.send('reported');
      } catch (err) {
        res.status(500).json({ error: 'Could not report reply' });
      }
    });
};
