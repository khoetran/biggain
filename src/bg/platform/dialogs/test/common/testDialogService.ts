/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import Severity from 'bg/base/common/severity';
import { IConfirmation, IConfirmationResult, IDialogService, IDialogOptions, IShowResult, IInputResult } from 'bg/platform/dialogs/common/dialogs';

export class TestDialogService implements IDialogService {

	declare readonly _serviceBrand: undefined;

	private confirmResult: IConfirmationResult | undefined = undefined;
	setConfirmResult(result: IConfirmationResult) {
		this.confirmResult = result;
	}

	async confirm(confirmation: IConfirmation): Promise<IConfirmationResult> {
		if (this.confirmResult) {
			const confirmResult = this.confirmResult;
			this.confirmResult = undefined;

			return confirmResult;
		}

		return { confirmed: false };
	}

	async show(severity: Severity, message: string, buttons?: string[], options?: IDialogOptions): Promise<IShowResult> { return { choice: 0 }; }
	async input(): Promise<IInputResult> { { return { choice: 0, values: [] }; } }
	async about(): Promise<void> { }
}
