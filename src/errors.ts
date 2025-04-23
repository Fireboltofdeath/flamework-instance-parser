export interface ParseError {
	instance: Instance;
	rootInstance: Instance;
	path: string[];
	message: string;
}

/**
 * Deduplicates error messages for a specific instance.
 */
export function emitParseErrors(errors: ParseError[]) {
	const MAX_PATH_ERROR_COUNT = 3;
	const errorsByPath = new Map<string, ParseError[]>();

	for (const err of errors) {
		const path = err.path.join(".");

		let pathErrors = errorsByPath.get(path);
		if (!pathErrors) errorsByPath.set(path, (pathErrors = []));

		pathErrors.push(err);
	}

	for (const [path, rawErrors] of errorsByPath) {
		const errors = deduplicateErrors(rawErrors);
		warn(`Error parsing ${path}:`);

		const errorCount = math.min(errors.size(), MAX_PATH_ERROR_COUNT);
		for (let i = 0; i < errorCount; i++) {
			const err = errors[i];
			warn(`\t\tFor`, err.instance, `:`, err.message);
		}

		if (errors.size() > MAX_PATH_ERROR_COUNT) {
			warn(`\t\t+${errors.size() - MAX_PATH_ERROR_COUNT} more errors,`, errors);
		}
	}
}

function deduplicateErrors(value: ParseError[]) {
	const seenInstances = new Map<Instance, Set<string>>();
	const results = new Array<ParseError>();

	for (const result of value) {
		let seenInstance = seenInstances.get(result.instance);
		if (!seenInstance) seenInstances.set(result.instance, (seenInstance = new Set()));

		if (seenInstance.has(result.message)) {
			continue;
		}

		seenInstance.add(result.message);
		results.push(result);
	}

	return results;
}
