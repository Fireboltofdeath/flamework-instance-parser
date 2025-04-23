import type { Modding } from "@flamework/core";

type ParseObjectKeys<T> = {
	[k in keyof T]-?: [k, ParserMetadata<NonNullable<T[k]>>, undefined extends T[k] ? true : false];
}[keyof T][];

export type ParserMetadata<T> = T extends { _fip_self?: [infer V] }
	? ["self", ParserMetadata<V>]
	: T extends { _fip_parent?: [infer V] }
	? ["parent", ParserMetadata<V>]
	: T extends { _fip_attribute?: [infer V, infer N extends string | undefined] }
	? ["attribute", Modding.Generic<V, "guard">, N]
	: T extends { _fip_property?: [infer V, infer N extends string | undefined] }
	? ["property", Modding.Generic<V, "guard">, N]
	: T extends { _fip_child?: [infer V, infer N extends string | undefined] }
	? ["child", ParserMetadata<V>, N]
	: T extends { _fip_custom?: [infer N extends string | undefined, infer M] }
	? ["custom", N, M]
	: T extends readonly (infer V)[]
	? ["array", ParserMetadata<V>]
	: T extends ReadonlyMap<infer K, infer V>
	? ["map", ParserMetadata<K>, ParserMetadata<V>]
	: T extends Instance
	? ["instance", Modding.Generic<T, "guard">]
	: T extends object
	? ["object", ParseObjectKeys<T>]
	: never;
