import express from 'express';
const router = express.Router();
import transporter from '../config/mailer.js';
import TrainingSession from '../models/TrainingSession.js';
import TrainingRequest from '../models/TrainingRequest.js';
import TrainingMilestone from '../models/TrainingMilestone.js';
import User from '../models/User.js';

router.get('/upcoming/:id', async (req, res) => {
	try {
		const upcoming = await TrainingRequest.find({student: req.params.id, deletedAt: null}).populate('instructor', 'fname lname cid').populate('milestone', 'code name').lean();
		res.stdRes.data = upcoming;
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
});

router.get('/past/:id', async (req, res) => {
	try {
		const past = await TrainingSession.find({student: req.params.id}).populate('instructor', 'fname lname cid').lean();
		res.stdRes.data = past;
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
});

router.post('/new', async (req, res) => {
	try {
		await TrainingRequest.create({
			student: req.body.submitter,
			startTime: req.body.startTime,
			endTime: req.body.endTime,
			milestone: req.body.milestone,
			remarks: req.body.remarks,
		});
		const student = await User.findById(req.body.submitter).select('fname lname').lean();

		transporter.sendMail({
			to: 'instructors@zabartcc.org',
			subject: 'New Training Request | Albuquerque ARTCC',
			template: 'newRequest',
			context: {
				student: student.fname + ' ' + student.lname,
				startTime: new Date(req.body.startTime).toLocaleString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}),
				endTime: new Date(req.body.endTime).toLocaleString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'})
			}
		});
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
});

router.get('/milestones/:id', async (req, res) => {
	try {
		const user = await User.findOne({_id: req.params.id}).select('trainingMilestones rating').populate('trainingMilestones', 'code name rating').lean();
		const milestones = await TrainingMilestone.find({}).lean();

		res.stdRes.data = {
			user,
			milestones
		};
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
});

export default router;