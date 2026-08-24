import type { ShoppingListExportInput } from '../../types/shopping';
import { formatQuantity } from '../units/format';

export function buildShoppingListText(input: ShoppingListExportInput): string {
  const sections: string[] = [`Shopping list - ${input.generatedOn}`];

  for (const group of input.groups) {
    const unpurchased = group.lines.filter((line) => !line.purchased);
    if (unpurchased.length === 0) {
      continue;
    }
    const entries = unpurchased.map((line) =>
      line.quantity === null
        ? `- ${line.label}`
        : `- ${line.label} ${formatQuantity(line.quantity)}`,
    );
    sections.push([group.categoryName.toUpperCase(), ...entries].join('\n'));
  }

  return sections.join('\n\n');
}
