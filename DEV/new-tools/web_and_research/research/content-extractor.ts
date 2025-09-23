// Web Content Extractor
// Intelligent web scraping with memory management and rate limiting

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ExtractedContent, 
  ContentExtractor, 
  MemoryStats 
} from '../types/research.js';

/**
 * Rate limiter for content extraction requests
 */
class ContentRateLimiter {
  private requestsPerMinute: number;
  private requests: Date[];

  constructor(requestsPerMinute: number = 20) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  async acquire(): Promise<void> {
    const now = new Date();
    
    // Remove requests older than 1 minute
    this.requests = this.requests.filter(
      req => now.getTime() - req.getTime() < 60 * 1000
    );

    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = this.requests[0];
      if (oldestRequest) {
        const waitTime = 60 - (now.getTime() - oldestRequest.getTime()) / 1000;

        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }
      }
    }

    this.requests.push(now);
  }
}

/**
 * Web content extractor with intelligent parsing and memory management
 */
export class WebContentExtractor implements ContentExtractor {
  private rateLimiter: ContentRateLimiter;
  private tempFiles: string[] = [];
  private readonly MAX_IN_MEMORY_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_CONTENT_LENGTH = 3000; // Characters - Reduced to prevent context limit issues
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  constructor() {
    this.rateLimiter = new ContentRateLimiter(15); // Conservative rate limit
    
    // Set up cleanup on process exit
    process.on('exit', this.cleanup.bind(this));
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit();
    });
    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit();
    });
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(): Promise<void> {
    for (const file of this.tempFiles) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.tempFiles = [];
  }

  /**
   * Get current memory statistics
   */
  async getMemoryStats(): Promise<MemoryStats> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercentage = (usedMemory / totalMemory) * 100;

    return {
      totalMemory,
      freeMemory,
      usedMemory,
      usagePercentage
    };
  }

  /**
   * Extract content from a single URL
   */
  async extractContent(url: string): Promise<ExtractedContent> {
    const startTime = new Date();
    
    try {
      // Apply rate limiting
      await this.rateLimiter.acquire();

      // Validate URL
      if (!this.isValidUrl(url)) {
        return {
          url,
          title: '',
          content: '',
          wordCount: 0,
          extractedAt: startTime,
          success: false,
          error: 'Invalid URL format'
        };
      }

      // Make the request
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 LinuxHelper/1.1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        maxRedirects: 5,
        timeout: this.REQUEST_TIMEOUT,
        responseType: 'text'
      });

      // Process the HTML content
      const { title, content } = await this.processHtml(response.data, url);
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      return {
        url,
        title,
        content,
        wordCount,
        extractedAt: startTime,
        success: true
      };

    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access forbidden (403)';
        } else if (error.response?.status === 404) {
          errorMessage = 'Page not found (404)';
        } else if (error.response?.status === 429) {
          errorMessage = 'Rate limited (429)';
        } else if (error.response?.status) {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        url,
        title: '',
        content: '',
        wordCount: 0,
        extractedAt: startTime,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Extract content from multiple URLs with batch processing
   */
  async extractMultiple(urls: string[]): Promise<ExtractedContent[]> {
    const results: ExtractedContent[] = [];
    const memoryStats = await this.getMemoryStats();
    
    // Determine batch size based on available memory
    let batchSize = 3; // Default
    if (memoryStats.usagePercentage > 70) {
      batchSize = 1; // Reduce batch size if memory is constrained
    } else if (memoryStats.usagePercentage < 30) {
      batchSize = 5; // Increase batch size if plenty of memory
    }

    // Process URLs in batches to manage memory and rate limits
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          try {
            return await this.extractContent(url);
          } catch (error) {
            return {
              url,
              title: '',
              content: '',
              wordCount: 0,
              extractedAt: new Date(),
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
      
      results.push(...batchResults);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Small delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Process HTML content and extract meaningful text
   */
  private async processHtml(html: string, url: string): Promise<{ title: string; content: string }> {
    const memoryStats = await this.getMemoryStats();
    
    // Use file-based processing for large content or high memory usage
    if (html.length > this.MAX_IN_MEMORY_SIZE || memoryStats.usagePercentage > 70) {
      return this.processHtmlWithFile(html, url);
    } else {
      return this.processHtmlInMemory(html);
    }
  }

  /**
   * Process HTML in memory (for smaller content)
   */
  private processHtmlInMemory(html: string): { title: string; content: string } {
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .menu, .navigation').remove();
    
    // Focus on main content areas
    let content = '';
    const mainSelectors = ['main', 'article', '.content', '.post', '.entry', '#content', '#main'];
    
    for (const selector of mainSelectors) {
      const mainContent = $(selector);
      if (mainContent.length > 0 && mainContent.text().trim().length > content.length) {
        content = mainContent.text().trim();
      }
    }
    
    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text().trim();
    }
    
    // Clean up the text
    content = this.cleanText(content);
    
    return { title, content };
  }

  /**
   * Process HTML using temporary file (for larger content)
   */
  private async processHtmlWithFile(html: string, _url: string): Promise<{ title: string; content: string }> {
    const tempFilePath = path.join(os.tmpdir(), `linux-helper-extract-${uuidv4()}.html`);
    this.tempFiles.push(tempFilePath);
    
    try {
      await fs.writeFile(tempFilePath, html);
      
      // Process the file
      const fileData = await fs.readFile(tempFilePath, 'utf-8');
      const result = this.processHtmlInMemory(fileData);
      
      // Clean up immediately
      await fs.unlink(tempFilePath);
      const index = this.tempFiles.indexOf(tempFilePath);
      if (index > -1) {
        this.tempFiles.splice(index, 1);
      }
      
      return result;
    } catch (error) {
      // Ensure cleanup even on error
      try {
        await fs.unlink(tempFilePath);
        const index = this.tempFiles.indexOf(tempFilePath);
        if (index > -1) {
          this.tempFiles.splice(index, 1);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    // Replace multiple whitespace with single space
    text = text.replace(/\s+/g, ' ');
    
    // Remove excessive newlines
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Trim whitespace
    text = text.trim();
    
    // Truncate if too long
    if (text.length > this.MAX_CONTENT_LENGTH) {
      text = text.substring(0, this.MAX_CONTENT_LENGTH) + "... [content truncated for length]";
    }
    
    return text;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if URL is likely to contain useful content
   */
  isRelevantUrl(url: string): boolean {
    const irrelevantPatterns = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|tar|gz|rar)$/i,
      /\.(jpg|jpeg|png|gif|bmp|svg|ico)$/i,
      /\.(mp3|mp4|avi|mov|wmv|flv)$/i,
      /facebook\.com\/.*\/posts/i,
      /twitter\.com\/.*\/status/i,
      /instagram\.com\/p\//i,
      /pinterest\.com\/pin/i,
      /youtube\.com\/watch/i,
      /linkedin\.com\/pulse/i
    ];

    return !irrelevantPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Prioritize URLs for Linux troubleshooting
   */
  prioritizeUrls(urls: string[]): string[] {
    const priorities = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    const highPriorityDomains = [
      'askubuntu.com',
      'stackoverflow.com',
      'unix.stackexchange.com',
      'linuxquestions.org',
      'archlinux.org',
      'ubuntu.com',
      'debian.org',
      'redhat.com',
      'kernel.org',
      'man7.org'
    ];

    const mediumPriorityDomains = [
      'reddit.com',
      'superuser.com',
      'serverfault.com',
      'linuxconfig.org',
      'tecmint.com',
      'digitalocean.com',
      'howtogeek.com'
    ];

    for (const url of urls) {
      if (!this.isRelevantUrl(url)) {
        continue;
      }

      const domain = this.extractDomain(url);
      
      if (highPriorityDomains.some(d => domain.includes(d))) {
        priorities.high.push(url);
      } else if (mediumPriorityDomains.some(d => domain.includes(d))) {
        priorities.medium.push(url);
      } else {
        priorities.low.push(url);
      }
    }

    return [...priorities.high, ...priorities.medium, ...priorities.low];
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch (error) {
      return '';
    }
  }
}