import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { registerModules } from '../modules/register';
registerModules();
afterEach(() => cleanup());
