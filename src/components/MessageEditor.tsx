/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import ResizeObserver from 'resize-observer-polyfill';
import React from 'react';
import { observer } from 'mobx-react-lite';
import {
	monaco,
	EditorDidMount,
	ControlledEditor,
	ControlledEditorOnChange,
	Monaco,
} from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import { Uri } from 'monaco-editor';
import { toJS } from 'mobx';
import { createInitialActMessage } from '../helpers/schema';
import { useStore } from '../hooks/useStore';
import Messages from '../stores/MessageList';

interface Props {
	messageSchema: JSONSchema4 | JSONSchema7 | null;
}

export interface MessageEditorMethods {
	getFilledMessage: () => object | null;
}

const DEFAULT_EDITOR_HEIGHT = 500;

const MessageEditor = ({ messageSchema }: Props, ref: React.Ref<MessageEditorMethods>) => {
	const store = useStore();

	const monacoRef = React.useRef<Monaco>();
	const valueGetter = React.useRef<(() => string) | null>(null);
	const uri = React.useRef<Uri>();
	const { editorCode, setEditorCode } = useStore();
	const [code, setCode] = React.useState('{}');

	const handleEditorDidMount: EditorDidMount = _valueGetter => {
		valueGetter.current = _valueGetter;
	};

	const [editorHeight, setEditorHeight] = React.useState(DEFAULT_EDITOR_HEIGHT);

	const editorHeightObserver = React.useRef(
		new ResizeObserver((entries: ResizeObserverEntry[]) => {
			setEditorHeight(entries[0]?.contentRect.height || DEFAULT_EDITOR_HEIGHT);
		}),
	);

	const rootRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (rootRef.current) {
			editorHeightObserver.current.observe(rootRef.current);
		}

		return () => {
			if (rootRef.current) {
				editorHeightObserver.current.unobserve(rootRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		monaco.init().then((_monaco: Monaco) => {
			monacoRef.current = _monaco;
			if (messageSchema) {
				initiateSchema(messageSchema);
			} else {
				monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [
						{
							uri: 'do.not.load',
							schema: {},
						},
					],
				});
			}
		});
	}, []);

	React.useEffect(() => {
		if (!monacoRef.current) return;
		if (messageSchema) {
			const schema = toJS(messageSchema);
			uri.current = monacoRef.current.Uri.parse('://b/$schema.json');

			initiateSchema(messageSchema);
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						uri: 'http://myserver/$schema.json',
						fileMatch: ['*'],
						schema,
					},
				],
			});
		} else {
			setCode('{}');
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						uri: 'do.not.load',
						schema: {},
					},
				],
			});
		}
	}, [messageSchema]);

	const onValueChange: ControlledEditorOnChange = (event, value) => {
		setCode(value || '{}');
		setEditorCode(value || '{ value is undefined }');
	};

	const initiateSchema = (message: JSONSchema4 | JSONSchema7) => {
		const initialSchema = createInitialActMessage(message) || '{}';
		setCode(initialSchema);
		store.setIsSchemaApplied(true);
	};

	React.useImperativeHandle(
		ref,
		() => ({
			getFilledMessage: () => {
				let filledMessage: object | null;
				try {
					filledMessage = JSON.parse(editorCode);
				} catch {
					filledMessage = null;
				}
				return filledMessage;
			},
		}),
		[editorCode],
	);

	return (
		<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
			<div ref={rootRef} style={{ height: '100%', width: '50%', marginRight: '20px' }}>
				<ControlledEditor
					height={editorHeight}
					language='json'
					value={code !== '{}' && !store.editMessageMode ? code : editorCode}
					onChange={onValueChange}
					editorDidMount={handleEditorDidMount}
				/>
			</div>
			<div style={{
				width: '50%', marginRight: '20px',
			}}>
				<Messages/>
			</div>
		</div>
	);
};

export default observer(MessageEditor, { forwardRef: true });
