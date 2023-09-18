import express from 'express';
const router = express.Router();
import PilotOnline from '../models/PilotOnline.js';
import AtcOnline from '../models/AtcOnline.js';
import ControllerHours from '../models/ControllerHours.js';

const airports = {
    BNA: 'Nashville',
    FSM: 'Fort Smith',
    HSV: 'Huntsville',
    JAN: 'Jackson',
    LIT: 'Little Rock',
    CBM: 'Columbus',
    HOP: 'Fort Campbell',
    NMM: 'Meridian',
    ASG: 'Springdale',
    CGI: 'Cape Girardeau',
    EOD: 'Sabre',
    FYV: 'Drake',
    GLH: 'Greenville',
    GTR: 'Golden Triangle',
    GWO: 'Greenwood',
    HKS: 'Hawkins',
    HUA: 'Redstone',
    JWN: 'John Tune',
    LIT: 'Little Rock',
    MEI: 'Key Field',
    MEM: 'Memphis',
    MKL: 'Jackson',
    MQY: 'Smyrna',
    NJW: 'Joe Williams',
    NQA: 'Millington',
    OLV: 'Olive Branch',
    PAH: 'Paducah',
    ROG: 'Rogers',
    TUP: 'Tupelo',
    XNA: 'Northwest Arkansas'
};

const positions = {
	DEL: 'Delivery',
	GND: 'Ground',
	TWR: 'Tower',
	DEP: 'Departure',
	APP: 'Approach',
	CTR: 'Center'
};

router.get('/', async ({res}) => {
	try {
		const pilots = await PilotOnline.find().lean();
		const atc = await AtcOnline.find().lean({virtuals: true});

		res.stdRes.data = {
			pilots: pilots,
			atc: atc
		}
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
});

router.get('/top', async (req, res) => {
	try {
		const d = new Date();
		const thisMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
		const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 1))
		const sessions = await ControllerHours.find({timeStart: {$gt: thisMonth, $lt: nextMonth}, position: {$not: /.*_(I|M)_.*/}}).populate('user', 'fname lname cid');
		const controllerTimes = {};
		const positionTimes = {};
		for(const session of sessions) {
			const posSimple = session.position.replace(/_[A-Z0-9]{1,3}_/, '_');
			const len = Math.round((session.timeEnd.getTime() - session.timeStart.getTime()) / 1000);
			if(!controllerTimes[session.cid]) {
				controllerTimes[session.cid] = {
					name: session.user ? `${session.user.fname} ${session.user.lname}` : session.cid,
					cid: session.cid,
					len: 0
				};
			}
			if(!positionTimes[posSimple]) {
				const posParts = posSimple.split('_');
				positionTimes[posSimple] = {
					name: `${airports[posParts[0]] ? airports[posParts[0]] : 'Unknown'} ${positions[posParts[1]] ? positions[posParts[1]] : 'Unknown'}`,
					len: 0
				}
			}
			controllerTimes[session.cid].len += len;
			positionTimes[posSimple].len += len;
		}
		res.stdRes.data.controllers = Object.values(controllerTimes).sort((a, b) => b.len - a.len).slice(0,5);
		res.stdRes.data.positions = Object.values(positionTimes).sort((a, b) => b.len - a.len).slice(0,5);
	} catch(e) {
		res.stdRes.ret_det = e;
	}

	return res.json(res.stdRes);
})

export default router;