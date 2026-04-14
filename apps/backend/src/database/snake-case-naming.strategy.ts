import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Maps camelCase TypeORM entity properties → snake_case PostgreSQL columns.
 * e.g.  logoUrl  →  logo_url
 *       planTier →  plan_tier
 */
export class SnakeCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    const prefix = embeddedPrefixes.length ? toSnakeCase(embeddedPrefixes.join('_')) + '_' : '';
    return prefix + (customName ?? toSnakeCase(propertyName));
  }

  relationName(propertyName: string): string {
    return toSnakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string): string {
    return toSnakeCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName);
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return toSnakeCase(tableName + '_' + (columnName ?? propertyName));
  }
}
