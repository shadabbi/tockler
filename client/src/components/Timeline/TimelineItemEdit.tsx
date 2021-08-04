import React, { useState, useEffect, memo } from 'react';
import { TimeOutput } from 'react-timekeeper';
import randomcolor from 'randomcolor';
import { ColorPicker } from './ColorPicker';
import { Logger } from '../../logger';
import moment from 'moment';
import { Box, Divider, Heading } from '@chakra-ui/layout';
import { Input } from '@chakra-ui/input';
import { Button } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { Select } from '@chakra-ui/select';
import { AiOutlineClose, AiOutlineSave } from 'react-icons/ai';
import { TimelineItemEditDeleteButton } from './TimelineItemEditDeleteButton';
import { TIME_FORMAT_SHORT } from '../../constants';
import { TimePicker } from './TimePicker';
import { HStack, VStack } from '@chakra-ui/react';
import { ITEM_TYPES } from '../../utils';
import { changeColorForApp } from '../../services/appSettings.api';
import { saveTrackItem, deleteByIds, updateTrackItemColor } from '../../services/trackItem.api';
import { useStoreActions, useStoreState } from '../../store/easyPeasy';

const COLOR_SCOPE_ONLY_THIS = 'ONLY_THIS';

export const TimelineItemEdit = memo(() => {
    const selectedTimelineItem = useStoreState(state => state.selectedTimelineItem);
    const setSelectedTimelineItem = useStoreActions(actions => actions.setSelectedTimelineItem);
    const fetchTimerange = useStoreActions(actions => actions.fetchTimerange);

    const [state, setState] = useState<any>({
        trackItem: selectedTimelineItem,
        colorScope: COLOR_SCOPE_ONLY_THIS,
    });

    const { trackItem, colorScope } = state;

    console.info('selectedTimelineItem,.,.,.,,.,,.,,.', selectedTimelineItem);

    const deleteTimelineItem = async () => {
        const id = trackItem.id;
        Logger.debug('Delete timeline trackItem', id);

        if (id) {
            await deleteByIds([id]);
            Logger.debug('Deleted timeline items', id);
            fetchTimerange();
            setSelectedTimelineItem(null);
        } else {
            Logger.error('No ids, not deleting from DB');
        }
    };

    const saveTimelineItem = async () => {
        Logger.debug('Updating color for trackItem', trackItem, colorScope);
        try {
            if (colorScope === 'ALL_ITEMS') {
                await changeColorForApp(trackItem.app, trackItem.color);
                await updateTrackItemColor(trackItem.app, trackItem.color);
            } else if (colorScope === 'NEW_ITEMS') {
                await changeColorForApp(trackItem.app, trackItem.color);
                await saveTrackItem(trackItem);
            } else {
                await saveTrackItem(trackItem);
            }
        } catch (error) {
            Logger.error('Saving track item failed', error);
        }

        setSelectedTimelineItem(null);
        fetchTimerange();
    };

    const clearTimelineItem = () => setSelectedTimelineItem(null);

    useEffect(() => {
        Logger.debug('Selected timelineitem changed:', selectedTimelineItem);

        setState({
            trackItem: selectedTimelineItem,
            colorScope: COLOR_SCOPE_ONLY_THIS,
        });
    }, [selectedTimelineItem]);

    const changeColorHandler = color => {
        Logger.debug('Changed color:', color);

        setState(oldState => ({
            ...oldState,
            trackItem: {
                ...oldState.trackItem,
                color,
            },
        }));
    };

    const changeAppName = e => {
        const { value } = e.target;
        Logger.debug('Changed app name:', value);

        setState(oldState => ({
            ...oldState,
            trackItem: {
                ...oldState.trackItem,
                app: value,
            },
        }));
    };

    const changeTime = attr => (value: TimeOutput) => {
        Logger.debug('Changed app time:', value);
        const oldDate = moment(state.trackItem[attr]);
        const newDate = oldDate
            .startOf('day')
            .set('hours', value.hour)
            .set('minutes', value.minute);

        setState(oldState => ({
            ...oldState,
            trackItem: {
                ...oldState.trackItem,
                [attr]: newDate.valueOf(),
            },
        }));
    };

    const changeAppTitle = e => {
        const { value } = e.target;
        Logger.debug('Changed app title:', value);

        setState(oldState => ({
            ...oldState,
            trackItem: {
                ...oldState.trackItem,
                title: value,
            },
        }));
    };

    const closeEdit = () => {
        Logger.debug('Close TimelineItem');
        clearTimelineItem();
    };

    const changeColorScopeHandler = newColorScope => {
        Logger.debug('Changed color scope:', newColorScope);

        setState(oldState => ({
            ...oldState,
            colorScope: newColorScope,
        }));
    };

    const saveBasedOnColorOptionHandler = () => {
        saveTimelineItem();
        setState(oldState => ({
            ...oldState,
            trackItem: {
                ...oldState.trackItem,
                app: '',
                title: '',
                color: randomcolor(),
            },
        }));
    };

    if (!selectedTimelineItem || !trackItem) {
        Logger.debug('No trackItem');
        return null;
    }

    const colorChanged = selectedTimelineItem.color !== trackItem.color;
    const isCreating = !selectedTimelineItem.id;

    return (
        <Box width={600}>
            <VStack alignItems="flex-start" spacing={4}>
                <Heading fontSize="xl" pb={2}>
                    {ITEM_TYPES[trackItem.taskName] || 'New Task'}
                </Heading>
                <HStack width="100%" spacing={4}>
                    <Box flex="2">
                        <Input value={trackItem.app} placeholder="App" onChange={changeAppName} />
                    </Box>
                    <Box flex="1" maxWidth="100px">
                        <TimePicker
                            time={moment(trackItem.beginDate).format(TIME_FORMAT_SHORT)}
                            onChange={changeTime('beginDate')}
                        />
                    </Box>
                    <Box flex="1" maxWidth="100px">
                        <TimePicker
                            time={moment(trackItem.endDate).format(TIME_FORMAT_SHORT)}
                            onChange={changeTime('endDate')}
                        />
                    </Box>
                </HStack>
                <Box w="100%">
                    <Input value={trackItem.title} placeholder="Title" onChange={changeAppTitle} />
                </Box>
                <HStack>
                    <Box>
                        <ColorPicker color={trackItem.color} onChange={changeColorHandler} />
                    </Box>
                    {colorChanged && (
                        <Tooltip
                            placement="left"
                            label="Can also change color for all items or all future items"
                        >
                            <Select value={colorScope} onChange={changeColorScopeHandler}>
                                <option value="ONLY_THIS">This trackItem</option>
                                <option value="NEW_ITEMS">Future items</option>
                                <option value="ALL_ITEMS">All items</option>
                            </Select>
                        </Tooltip>
                    )}
                </HStack>
            </VStack>

            <Box py={4}>
                <Divider />
            </Box>
            <HStack spacing={4}>
                {!isCreating && (
                    <Box>
                        <TimelineItemEditDeleteButton deleteItem={deleteTimelineItem} />
                    </Box>
                )}
                <Box flex={1}></Box>

                <Button variant="outline" leftIcon={<AiOutlineClose />} onClick={closeEdit}>
                    Cancel
                </Button>

                <Button leftIcon={<AiOutlineSave />} onClick={saveBasedOnColorOptionHandler}>
                    {isCreating ? 'Create' : 'Update'}
                </Button>
            </HStack>
        </Box>
    );
});
