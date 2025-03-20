import { IModify, IPersistence, IUIKitSurfaceViewParam } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import { IPoll } from './../IPoll';
import { uuid } from './uuid';
import { LayoutBlock } from '@rocket.chat/ui-kit';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';

export async function createPollModal({ id = '', question, persistence, data, pollData, modify, options = 2 }: {
    id?: string,
    question?: string,
    persistence: IPersistence,
    data,
    pollData?: IPoll,
    modify: IModify,
    options?: number,
}): Promise<IUIKitSurfaceViewParam> {
    const viewId = id || uuid();

    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, viewId);
    await persistence.createWithAssociation({ room: data.room }, association);

    const block: LayoutBlock[] = [{
        type: 'input',
        blockId: 'poll',
        element: {
            appId: 'pollBlock',
            blockId: 'poll',
            type: 'plain_text_input',
            actionId: 'question',
            initialValue: question,
        },
        label: {
            type: 'plain_text',
            text: 'Insert your question',
        },
    }, {
        type: 'divider',
    }]

    for (let i = 0; i < options; i++) {
        const optionValue = pollData ? pollData.options[i] : undefined;

        block.push({
            type: 'input',
            blockId: 'poll',
            optional: true,
            element: {
                appId: 'pollBlock',
                blockId: 'poll',
                type: 'plain_text_input',
                actionId: `option-${i}`,
                initialValue: optionValue,
                placeholder: {
                    type: 'plain_text',
                    text: 'Insert an option',
                },
            },
            label: {
                type: 'plain_text',
                text: '',
            },
        });
    }

    block.push({
        type: 'actions',
        blockId: 'config',
        elements: [
            {
                appId: 'pollBlock',
                blockId: 'poll',
                type: 'static_select',
                placeholder: {
                    type: 'plain_text',
                    text: 'Multiple choices',
                },
                actionId: 'mode',
                initialValue: pollData && pollData.singleChoice ? 'single' : 'multiple',
                options: [
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Multiple choices',
                        },
                        value: 'multiple',
                    },
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Single choice',
                        },
                        value: 'single',
                    },
                ],
            },
            {
                type: 'button',
                appId: 'pollBlock',
                blockId: 'poll',
                actionId: 'addChoice',
                text: {
                    type: 'plain_text',
                    text: 'Add a choice',
                },
                value: String(options + 1),
            },
            {
                type: 'static_select',
                appId: 'pollBlock',
                blockId: 'poll',
                actionId: 'visibility',
                placeholder: {
                    type: 'plain_text',
                    text: 'Open vote',
                },
                initialValue: pollData && pollData.confidential ? 'confidential' : 'open',
                options: [
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Open vote',
                        },
                        value: 'open',
                    },
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Confidential vote',
                        },
                        value: 'confidential',
                    },
                ],
            }
        ],
    });

    return {
        type: UIKitSurfaceType.MODAL,
        id: viewId,
        title: {
            type: 'plain_text',
            text: 'Create a poll',
        },
        submit: {
            type: 'button',
            appId: 'pollBlock',
            blockId: 'poll',
            actionId: 'submit',
            text: {
                type: 'plain_text',
                text: 'Create',
            },
        },
        close: {
            type: 'button',
            appId: 'pollBlock',
            blockId: 'poll',
            actionId: 'cancel',
            text: {
                type: 'plain_text',
                text: 'Cancel',
            },
        },
        blocks: block,
    };
}
