import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';
import { storeVote } from './storeVote';
import { PollrApp } from '../../PollrApp';

export async function votePoll({ app, data, read, persistence, modify }: {
    app: PollrApp,
    data,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    if (!data.message) {
        return {
            success: true,
        };
    }

    const poll = await getPoll(String(data.message.id), read);
    if (!poll) {
        throw new Error('no such poll');
    }

    if (poll.finished) {
        throw new Error('poll is already finished');
    }

    await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });

    const message = await modify.getUpdater().message(data.message.id as string, data.user);
    message.setEditor(message.getSender());

    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    const block = createPollBlocks(app, poll.question, poll.options, poll, showNames.value);

    message.setBlocks(block);

    return modify.getUpdater().finish(message);
}
