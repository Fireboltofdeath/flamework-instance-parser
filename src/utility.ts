const HAS_PROPERTY_CACHE = new Map<string, boolean>();

export function instanceHasProperty(instance: Instance, property: string) {
	const cacheKey = `${instance.ClassName}-${property}`;
	const cachedResult = HAS_PROPERTY_CACHE.get(cacheKey);
	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const [success] = pcall(() => instance[property as keyof Instance]);
	HAS_PROPERTY_CACHE.set(cacheKey, success);

	return success;
}

export function followObjectValues(instance: Instance) {
	if (instance.IsA("ObjectValue") && instance.Value) {
		return followObjectValues(instance.Value);
	}

	return instance;
}
