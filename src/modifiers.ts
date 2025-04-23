/**
 * Refers to the current instance being parsed.
 */
export type Self<T = Instance> = T & { _fip_self?: [T] };

/**
 * Refers to the parent of the current instance being parsed.
 */
export type Parent<T> = T & { _fip_parent?: [T] };

/**
 * Refers to an attribute on the current instance being parsed.
 *
 * A name can be provided or, if possible, will be inferred from the object key.
 */
export type Attribute<T, Name extends string | undefined = undefined> = T & { _fip_attribute?: [T, Name] };

/**
 * Refers to a property on the current instance being parsed.
 *
 * A name can be provided or, if possible, will be inferred from the object key.
 */
export type Property<T, Name extends string | undefined = undefined> = T & { _fip_property?: [T, Name] };

/**
 * Refers to a child on the current instance being parsed.
 *
 * A name can be provided or, if possible, will be inferred from the object key.
 *
 * This is the default for object fields, but this type aliases also allows renaming.
 */
export type Child<T, Name extends string | undefined = undefined> = T & { _fip_child?: [T, Name] };

/**
 * Allows you to specify a custom instance parser modifier.
 *
 * For example, a `Component<T>` modifier which accesses Flamework components.
 *
 * @unimplemented
 */
export type Custom<Name extends string | undefined, T, Meta = undefined> = T & { _fip_custom?: [Name, Meta] };
