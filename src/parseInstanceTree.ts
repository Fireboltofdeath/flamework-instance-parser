import type { Modding } from "@flamework/core";
import { followObjectValues, instanceHasProperty } from "./utility";
import type { ParserMetadata } from "./metadata";
import type { ParseError } from "./errors";

interface SharedContext {
	currentPath: string[];
	errors: ParseError[];
}

interface InvocationContext {
	field?: FieldContext;
}

interface FieldContext {
	name: string;
	optional: boolean;
}

type ParseResult<T> = { success: true; value: T } | { success: false; errors: ParseError[]; incompleteValue: unknown };

/**
 * Attempts to parse an instance tree from this description.
 *
 * @metadata macro
 */
export function parseInstanceTree<T>(rootInstance: Instance, meta?: Modding.Many<ParserMetadata<T>>): ParseResult<T> {
	assert(meta);

	const sharedContext: SharedContext = {
		errors: [],
		currentPath: ["<ROOT>"],
	};

	function complain(instance: Instance, message: string) {
		sharedContext.errors.push({
			instance,
			rootInstance,
			message,
			path: table.clone(sharedContext.currentPath),
		});
	}

	function withPath<T>(path: string, callback: () => T) {
		sharedContext.currentPath.push(path);
		const result = callback();
		sharedContext.currentPath.pop();
		return result;
	}

	/**
	 * When used in an object, some modifiers will refer to the current instance whilst others refer to the child named by the object field.
	 *
	 * In both cases, the intended relationship can be made explicit by using either `Self<T>` or `Child<T>`, but this function handles the implicit behavior.
	 */
	function getChildTarget(instance: Instance, field?: FieldContext) {
		if (field !== undefined) {
			const child = instance.FindFirstChild(field.name);
			if (!child && field.optional !== true) {
				complain(instance, `Child '${field.name}' does not exist under instance.`);
			}

			return child;
		}

		return instance;
	}

	function parse<T>(instance: Instance, ctx: InvocationContext, meta: ParserMetadata<T>): unknown {
		instance = followObjectValues(instance);

		const kind = meta[0];
		if (kind === "self") {
			return parse(instance, {}, meta[1] as never);
		} else if (kind === "attribute") {
			const guard = meta[1];
			const name = meta[2] ?? ctx.field?.name;
			if (name === undefined) {
				complain(instance, `Attribute name was not provided.`);
				return;
			}

			const attribute = instance.GetAttribute(name);
			if (attribute === undefined && ctx.field?.optional === true) {
				return;
			}

			if (!guard(attribute)) {
				if (attribute === undefined) {
					complain(instance, `Attribute '${name}' does not exist on instance.`);
					return attribute;
				}

				complain(instance, `Attribute '${name}' on instance does not match the provided type.`);
				return attribute;
			}

			return attribute;
		} else if (kind === "property") {
			const guard = meta[1];
			const name = meta[2] ?? ctx.field?.name;
			if (name === undefined) {
				complain(instance, `Property name was not provided.`);
				return;
			}

			if (!instanceHasProperty(instance, name)) {
				complain(instance, `Class '${instance.ClassName}' does not have a '${name}' property`);
				return;
			}

			const property = instance[name as keyof Instance];
			if (property === undefined && ctx.field?.optional === true) {
				return;
			}

			if (!guard(property)) {
				if (property === undefined) {
					complain(instance, `Property '${name}' on instance is set to nil.`);
					return;
				}

				complain(instance, `Property '${name}' on instance does not match the provided type.`);
				return;
			}

			return property;
		} else if (kind === "child") {
			const childMeta = meta[1];
			const name = meta[2] ?? ctx.field?.name;
			if (name === undefined) {
				complain(instance, `Child name was not provided.`);
				return;
			}

			const child = instance.FindFirstChild(name);
			if (!child) {
				if (ctx.field?.optional === true) {
					return;
				}

				complain(instance, `Child '${name}' does not exist under instance.`);
				return;
			}

			return parse(child, {}, childMeta);
		} else if (kind === "instance") {
			const guard = meta[1];
			const target = getChildTarget(instance, ctx.field);
			if (target === undefined) {
				return;
			}

			if (!guard(target)) {
				if (target === undefined) {
					complain(instance, `Child '${ctx.field!.name}' does not exist under instance.`);
					return;
				}

				complain(instance, `Instance does not match instance guard.`);
				return;
			}

			return target;
		} else if (kind === "parent") {
			if (!instance.Parent) {
				if (ctx.field && ctx.field.optional) {
					return;
				}

				complain(instance, `Instance does not have a parent.`);
				return;
			}

			return parse(instance.Parent, {}, meta[1] as never);
		} else if (kind === "array") {
			const target = getChildTarget(instance, ctx.field);
			if (target === undefined) {
				return;
			}

			const children = new Array<defined>();

			for (const child of target.GetChildren()) {
				children.push(withPath("<ARRAY ELEMENT>", () => parse(child, {}, meta[1]))!);
			}

			return children;
		} else if (kind === "map") {
			const target = getChildTarget(instance, ctx.field);
			if (target === undefined) {
				return;
			}

			const children = new Map();

			for (const child of target.GetChildren()) {
				const key = withPath("<MAP KEY>", () => parse(child, ctx, meta[1]));
				const value = withPath("<MAP VALUE>", () => parse(child, ctx, meta[2]));

				if (key !== undefined) {
					children.set(key, value);
				}
			}

			return children;
		} else if (kind === "object") {
			const target = getChildTarget(instance, ctx.field);
			if (target === undefined) {
				return;
			}

			const object = new Map();

			for (const [key, value, optional] of meta[1]) {
				withPath(key as string, () => {
					object.set(key, parse(target, { field: { name: key as string, optional } }, value));
				});
			}

			return object;
		} else {
			error(`unexpected attribute kind: ${kind}`);
		}
	}

	const parsed = parse(rootInstance, {}, meta as never);
	if (sharedContext.errors.size() > 0) {
		return {
			success: false,
			errors: sharedContext.errors,
			incompleteValue: parsed,
		};
	} else {
		return {
			success: true,
			value: parsed as T,
		};
	}
}
