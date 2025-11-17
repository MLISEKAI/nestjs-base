import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MockDataService {
  private dataCache: Map<string, any> = new Map();

  private getDataPath(filename: string): string {
    return path.join(process.cwd(), 'mock-data', filename);
  }

  loadData<T>(filename: string): T[] {
    const cacheKey = filename;
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    try {
      const filePath = this.getDataPath(filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as T[];
      this.dataCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error loading mock data from ${filename}:`, error);
      return [];
    }
  }

  saveData<T>(filename: string, data: T[]): void {
    try {
      const filePath = this.getDataPath(filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.dataCache.set(filename, data);
    } catch (error) {
      console.error(`Error saving mock data to ${filename}:`, error);
    }
  }

  clearCache(): void {
    this.dataCache.clear();
  }
}

