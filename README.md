# flamework-instance-parser
This is a small library that allows you to convert instances into a specified structure.

## Capabilities
This is an interface showing all the features of flamework-instance-parser, see the [Demo](#demo) section for a functional example.

```ts
interface Description {
	// Fetches a string attribute called "attribute", inferred from the field name.
	attribute: Attribute<string>;

	// Same as above, except with an explicit attribute name.
	attributeButRenamed: Attribute<string, "attribute">;

	// Retrieves a property from the instance, in this case the name.
	name: Property<string>;

	// Same as above, except with an explicit property name.
	nameButRenamed: Property<string, "Name">;

	// You can access children using the `Child` modifier
	child: Child<{ name: Property<string> }>;

	// Same as above, except with an explicit child name.
	childButRenamed: Child<{ name: Property<string> }, "child">;

	// Children can also be implicit, but does not support renaming.
	childButImplicit: { name: Property<string> };

	// Specifying an Instance type will give you access to the instance being parsed, with a type guard.
	childButInstance: BasePart;

	// Arrays parse each child under `parts` as the array's element type.
	parts: Array<{ name: Property<string> }>;

	// Maps parse each child under `partsButMap` using both the key and value.
	partsButMap: Map<Instance, { name: Property<string> }>;

	// This creates a map of the child's Name to its instance, duplicate keys get overwritten.
	partsButMapByName: Map<Property<string, "Name">, Instance>;

	// This modifier allows you to parse a type as the current instance instead of a child.
	selfInstance: Self<Instance>;

	// This can be used in conjunction with arrays to parse children, but any valid parseable type will work.
	selfChildren: Self<BasePart[]>;

	// This allows you to reference this instance's parent, and supports any valid parseable type.
	parentInstance: Parent<Instance>;
}
```

## Demo
This is a minimal demo showing functional code, see the [Capabilities](#capabilities) section for explanation of features.

```ts
interface Description {
	// Refers to the current instance being parsed
	self: Self<Instance>;

	// Collects all of the children on the current instance as an array
	selfChildren: Self<Instance[]>;

	// Fetches the name on the current instance
	myName: Property<string, "Name">;

	// Collects the names of all the children on the current instance
	myChildrenNames: Self<Array<Property<string, "Name">>>;

	// Fetches the name on the current instance's parent
	parentName: Parent<Property<string, "Name">>;

	// Fetches an attribute on the current instance
	attribute: Attribute<number>;
}

Workspace.SetAttribute("attribute", 42);

// Uncomment to trigger an error
// Workspace.SetAttribute("attribute", "invalid attribute type!");

for (let i = 0; i < 10; i++) {
	const part = new Instance("Part");
	part.Name = `Part ${i}`;
	part.Parent = Workspace;
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
