import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The design system's font-size keys share the `text-` prefix with colors; without this,
// tailwind-merge would treat `text-body` as a color and drop a real text color.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['display-xl', 'display-lg', 'display-md', 'title', 'heading', 'body-lg', 'body', 'small']
        }
      ]
    }
  }
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
