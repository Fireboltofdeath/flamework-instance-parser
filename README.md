# flamework-instance-parser
This is a small library that allows you to convert instances into a specified structure.

## Demo
```ts
interface Description {
	// Fetches a string attribute called "attribute", inferred from the field name.
	attribute: Attribute<string>,

	// Same as above, except with an explicit attribute name.
	attributeButRenamed: Attribute<string, "attribute">,

	// Retrieves a property from the instance, in this case the name.
	name: Property<string>,

	// Same as above, except with an explicit property name.
	nameButRenamed: Property<string, "Name">,

	// You can access children using the `Child` modifier
	child: Child<{ name: Property<string> }>,

	// Same as above, except with an explicit child name.
	childButRenamed: Child<{ name: Property<string> }, "child">,

	// Children can also be implicit, but does not support renaming.
	childButImplicit: { name: Property<string> },

	// Specifying an Instance type will give you access to the instance being parsed, with a type guard.
	childButInstance: BasePart,

	// Arrays parse each child under `parts` as the array's element type.
	parts: Array<{ name: Property<string> }>,

	// Maps parse each child under `partsButMap` using both the key and value.
	partsButMap: Map<Instance, { name: Property<string> }>,

	// This creates a map of the child's Name to its instance, duplicate keys get overwritten.
	partsButMapByName: Map<Property<string, "Name">, Instance>,

	// This modifier allows you to parse a type as the current instance instead of a child.
	selfInstance: Self<Instance>,

	// This can be used in conjunction with arrays to parse children, but any valid parseable type will work.
	selfChildren: Self<BasePart[]>,

	// This allows you to reference this instance's parent, and supports any valid parseable type.
	parentInstance: Parent<Instance>,
}

const result = parseInstanceTree<Description>(Workspace);
if (result.success) {
	print("Successfully parsed Workspace!", result.value);
} else {
	warn("Failed to parse Workspace!", result.errors);

	// flamework-instance-parser comes with a function to emit nicely formatted errors, as well
	// This function emits warnings so that the instance names can be clicked on for debugging.
	emitParseErrors(result.errors);

	// You can access the (incomplete) parsed object as well, but it is typed as `unknown` as it may not have been parsed correctly or fully.
	warn("Incomplete parsed object", result.incompleteValue);
}
```
