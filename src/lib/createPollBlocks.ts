import { IPoll } from '../IPoll';
import { buildVoteGraph } from './buildVoteGraph';
import { buildVoters } from './buildVoters';
import { LayoutBlock, Option } from '@rocket.chat/ui-kit';
import { PollrApp } from '../../PollrApp';

export function createPollBlocks(app: PollrApp, question: string, options: Array<any>, poll: IPoll, showNames: boolean): LayoutBlock[] {
    const overflowMenu: Option[] = [
        {
            text: {
                type: 'plain_text',
                text: 'Duplicate',
            },
            value: 'duplicate',
        },
        ...(!poll.finished
            ? [{
                text: {
                    type: 'plain_text',
                    text: 'Finish poll',
                },
                value: 'finish',
            }]
            : []),
    ] as Option[];


    const block: LayoutBlock[] = [
        {
            type: 'section',
            text: {
                type: 'plain_text',
                text: question,
            },
            accessory: {
                type: 'overflow',
                appId: app.getID(),
                blockId: 'extraOptions',
                actionId: 'extraOptions',
                options: overflowMenu,
            },
        }
    ];

    if (poll.finished) {
        block.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: `The poll has been finished at ${new Date().toUTCString()}`,
                },
            ],
        });
    }

    block.push({ type: 'divider' });

    options.forEach((option, index) => {
        block.push({
            type: 'section',
            text: {
                type: 'plain_text',
                text: option,
            },
            ...!poll.finished && {
                accessory: {
                    type: 'button',
                    actionId: 'vote',
                    text: {
                        type: 'plain_text',
                        text: 'Vote',
                    },
                    value: String(index),
                } as any,
            },
        });

        if (!poll.votes[index]) {
            return;
        }

        const graph = buildVoteGraph(poll.votes[index], poll.totalVotes);
        block.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: graph,
                },
            ],
        });

        if (poll.confidential) {
            return;
        }

        const voters = buildVoters(poll.votes[index], showNames);
        if (!voters) {
            return;
        }

        block.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: voters,
                },
            ],
        });
    });

    return block;
}
