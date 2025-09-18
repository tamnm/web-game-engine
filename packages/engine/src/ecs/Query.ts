import { ComponentDefinition, ComponentQuery, QueryResult, World } from './types';

function matches(world: World, entity: number, spec: ComponentQuery): boolean {
  if (spec.all && !spec.all.every((c) => world.getComponent(entity, c) !== undefined)) {
    return false;
  }
  if (spec.any && !spec.any.some((c) => world.getComponent(entity, c) !== undefined)) {
    return false;
  }
  if (spec.none && spec.none.some((c) => world.getComponent(entity, c) !== undefined)) {
    return false;
  }
  return true;
}

export function createQueryResult<T extends Record<string, unknown>>(
  world: World,
  entities: number[],
  spec: ComponentQuery
): QueryResult<T> {
  const matched = entities.filter((entity) => matches(world, entity, spec));
  return {
    size: matched.length,
    [Symbol.iterator]() {
      let index = 0;
      return {
        next: () => {
          if (index >= matched.length) {
            return { done: true, value: undefined } as const;
          }
          const entity = matched[index++];
          const payload: Record<string, unknown> = { entity };
          const include = new Set<ComponentDefinition<unknown>>(spec.all ?? []);
          spec.any?.forEach((c) => include.add(c as ComponentDefinition<unknown>));
          include.forEach((definition) => {
            const data = world.getComponent(entity, definition);
            if (data !== undefined) {
              payload[definition.name] = data;
            }
          });
          return { done: false, value: payload as T } as const;
        },
      };
    },
  };
}
