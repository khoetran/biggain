/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as strings from 'bg/base/common/strings';

enum Severity {
	Ignore = 0,
	Info = 1,
	Warning = 2,
	Error = 3
}

namespace Severity {

	const _error = 'error';
	const _warning = 'warning';
	const _warn = 'warn';
	const _info = 'info';
	const _ignore = 'ignore';

	/**
	 * Parses 'error', 'warning', 'warn', 'info' in call casings
	 * and falls back to ignore.
	 */
	export function fromValue(value: string): Severity {
		if (!value) {
			return Severity.Ignore;
		}

		if (strings.equalsIgnoreCase(_error, value)) {
			return Severity.Error;
		}

		if (strings.equalsIgnoreCase(_warning, value) || strings.equalsIgnoreCase(_warn, value)) {
			return Severity.Warning;
		}

		if (strings.equalsIgnoreCase(_info, value)) {
			return Severity.Info;
		}
		return Severity.Ignore;
	}

	export function toString(severity: Severity): string {
		switch (severity) {
			case Severity.Error: return _error;
			case Severity.Warning: return _warning;
			case Severity.Info: return _info;
			default: return _ignore;
		}
	}
}

export default Severity;
