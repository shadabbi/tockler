import moment from 'moment';
import { convertDate } from '../../constants';

export const sumAppObject = visibleTimerange => (newItem, item) => {
    const [beginClamp, endClamp] = visibleTimerange;

    const beginDate = moment.max(beginClamp, convertDate(item.beginDate));
    const endDate = moment.min(endClamp, convertDate(item.endDate));

    const diff = endDate.diff(beginDate);
    if (diff < 0) {
        return { ...item, timeDiffInMs: newItem.timeDiffInMs };
    }

    return { ...item, timeDiffInMs: newItem.timeDiffInMs + diff };
};
export const sumApp = visibleTimerange => (timeDiffInMs, item) => {
    const newItem = sumAppObject(visibleTimerange)({ timeDiffInMs }, item);
    return newItem.timeDiffInMs;
};

export const getOnlineTime = (items, visibleTimerange) => {
    const onlineItems = items.filter(item => item.app === 'ONLINE');
    return onlineItems.reduce(sumApp(visibleTimerange), 0);
};
export const getLastOnlineTime = (items, visibleTimerange) => {
    const onlineItems = items.filter(item => item.app === 'ONLINE');
    if (onlineItems.length > 0) {
        return [onlineItems.reverse()[0]].reduce(sumApp(visibleTimerange), 0);
    }
    return;
};

export const getTasksTime = (items, visibleTimerange) => {
    return items.reduce(sumApp(visibleTimerange), 0);
};
