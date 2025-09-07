/**
 * AI-powered project improvement suggestions tool
 */

import { z } from 'zod';
import { BuiltInTool, ToolResult } from '../types/index.js';
import { WorkspaceManager } from '../../../workspace/index.js';

const SuggestProjectImprovementsSchema = z.object({
  focus: z.enum(['performance', 'security', 'maintainability', 'documentation', 'testing', 'all'])
    .optional().default('all').describe('Focus area for improvement suggestions'),
  priority: z.enum(['high', 'medium', 'low', 'all'])
    .optional().default('all').describe('Priority level of suggestions to include')
});

type SuggestProjectImprovementsParams = z.infer<typeof SuggestProjectImprovementsSchema>;

interface ImprovementSuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  icon: string;
}

function generateProjectImprovements(workspaceContext: any): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  
  // Security improvements
  if (workspaceContext.projectType === 'nodejs') {
    if (!workspaceContext.dependencies?.includes('helmet') && 
        workspaceContext.features.some((f: any) => f.name.includes('Express'))) {
      suggestions.push({
        category: 'security',
        priority: 'high',
        title: 'Add Helmet.js for Security Headers',
        description: 'Implement Helmet.js middleware to set security-related HTTP headers',
        rationale: 'Express applications should use Helmet.js to protect against common web vulnerabilities',
        estimatedEffort: 'low',
        icon: '🛡️'
      });
    }
    
    if (!workspaceContext.configFiles?.includes('.env') && 
        !workspaceContext.configFiles?.includes('.env.example')) {
      suggestions.push({
        category: 'security',
        priority: 'medium',
        title: 'Add Environment Configuration',
        description: 'Create .env file for environment variables and .env.example for documentation',
        rationale: 'Environment variables should be used for sensitive configuration data',
        estimatedEffort: 'low',
        icon: '🔐'
      });
    }
  }
  
  // Testing improvements
  if (!workspaceContext.features.some((f: any) => f.type === 'testing')) {
    const testFramework = workspaceContext.projectType === 'nodejs' ? 'Jest or Vitest' :
                         workspaceContext.projectType === 'python' ? 'pytest' :
                         workspaceContext.projectType === 'rust' ? 'built-in testing' :
                         'appropriate testing framework';
    
    suggestions.push({
      category: 'testing',
      priority: 'high',
      title: `Add ${testFramework} Testing Framework`,
      description: `Set up ${testFramework} for automated testing`,
      rationale: 'Automated tests improve code quality and prevent regressions',
      estimatedEffort: 'medium',
      icon: '🧪'
    });
  }
  
  if (workspaceContext.testDirectories.length === 0 && 
      workspaceContext.features.some((f: any) => f.type === 'testing')) {
    suggestions.push({
      category: 'testing',
      priority: 'medium',
      title: 'Organize Test Directory Structure',
      description: 'Create dedicated test directories (tests/, __tests__, or spec/)',
      rationale: 'Well-organized test structure improves maintainability',
      estimatedEffort: 'low',
      icon: '📁'
    });
  }
  
  // Documentation improvements
  if (!workspaceContext.documentFiles?.includes('README.md')) {
    suggestions.push({
      category: 'documentation',
      priority: 'high',
      title: 'Create Comprehensive README.md',
      description: 'Add detailed README with installation, usage, and contribution guidelines',
      rationale: 'Good documentation is essential for project adoption and maintenance',
      estimatedEffort: 'medium',
      icon: '📚'
    });
  }
  
  if (!workspaceContext.documentFiles?.includes('CONTRIBUTING.md') && 
      workspaceContext.gitRepository) {
    suggestions.push({
      category: 'documentation',
      priority: 'medium',
      title: 'Add Contributing Guidelines',
      description: 'Create CONTRIBUTING.md with development setup and contribution process',
      rationale: 'Clear contributing guidelines encourage community participation',
      estimatedEffort: 'low',
      icon: '🤝'
    });
  }
  
  // Performance improvements
  if (workspaceContext.projectType === 'nodejs') {
    if (workspaceContext.features.some((f: any) => f.name === 'TypeScript') &&
        !workspaceContext.configFiles?.includes('tsconfig.json')) {
      suggestions.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize TypeScript Configuration',
        description: 'Fine-tune tsconfig.json for better compilation performance',
        rationale: 'Optimized TypeScript configuration improves build times',
        estimatedEffort: 'low',
        icon: '⚡'
      });
    }
    
    if (workspaceContext.dependencies?.includes('express') &&
        !workspaceContext.dependencies?.includes('compression')) {
      suggestions.push({
        category: 'performance',
        priority: 'medium',
        title: 'Add Response Compression',
        description: 'Implement gzip compression middleware for better response times',
        rationale: 'Compression reduces bandwidth usage and improves response times',
        estimatedEffort: 'low',
        icon: '📦'
      });
    }
  }
  
  // Maintainability improvements
  if (workspaceContext.projectType === 'nodejs' &&
      !workspaceContext.configFiles?.some((f: any) => f.includes('eslint'))) {
    suggestions.push({
      category: 'maintainability',
      priority: 'medium',
      title: 'Add ESLint Configuration',
      description: 'Set up ESLint for consistent code style and quality',
      rationale: 'Linting tools help maintain consistent code quality',
      estimatedEffort: 'low',
      icon: '🎨'
    });
  }
  
  if (workspaceContext.projectType === 'nodejs' &&
      !workspaceContext.configFiles?.some((f: any) => f.includes('prettier'))) {
    suggestions.push({
      category: 'maintainability',
      priority: 'low',
      title: 'Add Prettier for Code Formatting',
      description: 'Configure Prettier for automatic code formatting',
      rationale: 'Consistent formatting improves code readability',
      estimatedEffort: 'low',
      icon: '✨'
    });
  }
  
  // CI/CD improvements
  if (workspaceContext.gitRepository &&
      !workspaceContext.configFiles?.some((f: any) => f.includes('.github'))) {
    suggestions.push({
      category: 'maintainability',
      priority: 'medium',
      title: 'Set Up GitHub Actions CI/CD',
      description: 'Create automated workflows for testing and deployment',
      rationale: 'Continuous integration improves code quality and deployment reliability',
      estimatedEffort: 'medium',
      icon: '🚀'
    });
  }
  
  return suggestions;
}

const suggestProjectImprovementsTool: BuiltInTool = {
  name: 'suggest_project_improvements',
  description: 'Analyze project and suggest specific improvements for code quality, security, and maintainability',
  category: 'filesystem',
  parameters: SuggestProjectImprovementsSchema,
  
  async execute(params: SuggestProjectImprovementsParams): Promise<ToolResult> {
    try {
      const workspaceManager = WorkspaceManager.getInstance();
      const workspaceContext = await workspaceManager.detectWorkspace();
      
      if (!workspaceContext || workspaceContext.projectType === 'unknown') {
        return {
          success: true,
          message: '🤷‍♂️ No recognizable project structure detected. Cannot provide specific improvement suggestions.'
        };
      }

      const allSuggestions = generateProjectImprovements(workspaceContext);
      
      // Filter suggestions based on focus and priority
      let filteredSuggestions = allSuggestions;
      
      if (params.focus !== 'all') {
        filteredSuggestions = filteredSuggestions.filter(s => s.category === params.focus);
      }
      
      if (params.priority !== 'all') {
        filteredSuggestions = filteredSuggestions.filter(s => s.priority === params.priority);
      }
      
      if (filteredSuggestions.length === 0) {
        return {
          success: true,
          message: `🎉 Great! No ${params.focus !== 'all' ? params.focus : ''} ${params.priority !== 'all' ? params.priority + ' priority' : ''} improvements needed right now.`
        };
      }

      // Build concise message; return structured data so UI can table it
      const summary = `💡 ${filteredSuggestions.length} suggestions` +
        (params.focus !== 'all' ? ` • focus: ${params.focus}` : '') +
        (params.priority !== 'all' ? ` • priority: ${params.priority}` : '');

      return {
        success: true,
        data: {
          project: workspaceContext.projectName || 'Current Project',
          type: workspaceContext.projectType,
          focus: params.focus,
          priority: params.priority,
          suggestions: filteredSuggestions,
        },
        message: summary
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

export { suggestProjectImprovementsTool };
