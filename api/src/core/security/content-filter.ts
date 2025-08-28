import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ContentFilterResult {
  isSafe: boolean;
  confidence: number;
  categories: string[];
  details: Record<string, any>;
}

export interface ImageAnalysisResult {
  adult: number;
  spoof: number;
  medical: number;
  violence: number;
  racy: number;
}

@Injectable()
export class ContentFilterService {
  private readonly unsafeKeywords = [
    'nude', 'naked', 'explicit', 'pornographic', 'sexual', 'violence',
    'blood', 'gore', 'weapon', 'gun', 'knife', 'death', 'suicide',
    'hate', 'discrimination', 'racist', 'sexist', 'offensive'
  ];

  private readonly moderateKeywords = [
    'suggestive', 'revealing', 'provocative', 'fighting', 'conflict',
    'danger', 'risk', 'alcohol', 'drugs', 'smoking'
  ];

  constructor(private configService: ConfigService) {}

  async filterText(text: string): Promise<ContentFilterResult> {
    const lowerText = text.toLowerCase();
    
    // Check for unsafe keywords
    const foundUnsafe = this.unsafeKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );
    
    // Check for moderate keywords
    const foundModerate = this.moderateKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );

    const isSafe = foundUnsafe.length === 0;
    const confidence = this.calculateConfidence(foundUnsafe, foundModerate);
    const categories = [...foundUnsafe, ...foundModerate];

    return {
      isSafe,
      confidence,
      categories,
      details: {
        unsafeKeywords: foundUnsafe,
        moderateKeywords: foundModerate,
        textLength: text.length
      }
    };
  }

  async filterImage(imageBuffer: Buffer): Promise<ContentFilterResult> {
    // In a real implementation, this would use a computer vision API
    // like Google Vision API, AWS Rekognition, or Azure Computer Vision
    
    try {
      // Simulate image analysis
      const analysis = await this.analyzeImage(imageBuffer);
      
      const isSafe = this.isImageSafe(analysis);
      const confidence = this.calculateImageConfidence(analysis);
      const categories = this.getImageCategories(analysis);

      return {
        isSafe,
        confidence,
        categories,
        details: {
          analysis,
          imageSize: imageBuffer.length
        }
      };
    } catch (error) {
      // If analysis fails, err on the side of caution
      return {
        isSafe: false,
        confidence: 0.5,
        categories: ['analysis_failed'],
        details: {
          error: error.message,
          imageSize: imageBuffer.length
        }
      };
    }
  }

  async filterPrompt(prompt: string): Promise<ContentFilterResult> {
    // Filter AI generation prompts for unsafe content
    const textResult = await this.filterText(prompt);
    
    // Additional prompt-specific checks
    const promptSpecific = this.checkPromptSpecific(prompt);
    
    return {
      isSafe: textResult.isSafe && promptSpecific.isSafe,
      confidence: Math.min(textResult.confidence, promptSpecific.confidence),
      categories: [...textResult.categories, ...promptSpecific.categories],
      details: {
        ...textResult.details,
        ...promptSpecific.details
      }
    };
  }

  private async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    // Simulate image analysis with random values
    // In production, this would call a real CV API
    return {
      adult: Math.random() * 0.1, // Low probability for adult content
      spoof: Math.random() * 0.05, // Very low probability for spoof
      medical: Math.random() * 0.2, // Low probability for medical content
      violence: Math.random() * 0.15, // Low probability for violence
      racy: Math.random() * 0.1 // Low probability for racy content
    };
  }

  private isImageSafe(analysis: ImageAnalysisResult): boolean {
    const thresholds = {
      adult: 0.7,
      spoof: 0.8,
      medical: 0.8,
      violence: 0.7,
      racy: 0.7
    };

    return (
      analysis.adult < thresholds.adult &&
      analysis.spoof < thresholds.spoof &&
      analysis.medical < thresholds.medical &&
      analysis.violence < thresholds.violence &&
      analysis.racy < thresholds.racy
    );
  }

  private calculateImageConfidence(analysis: ImageAnalysisResult): number {
    const maxScore = Math.max(
      analysis.adult,
      analysis.spoof,
      analysis.medical,
      analysis.violence,
      analysis.racy
    );
    
    return 1 - maxScore; // Higher confidence for lower risk scores
  }

  private getImageCategories(analysis: ImageAnalysisResult): string[] {
    const categories = [];
    const threshold = 0.5;

    if (analysis.adult > threshold) categories.push('adult');
    if (analysis.spoof > threshold) categories.push('spoof');
    if (analysis.medical > threshold) categories.push('medical');
    if (analysis.violence > threshold) categories.push('violence');
    if (analysis.racy > threshold) categories.push('racy');

    return categories;
  }

  private calculateConfidence(unsafeKeywords: string[], moderateKeywords: string[]): number {
    const totalKeywords = unsafeKeywords.length + moderateKeywords.length;
    if (totalKeywords === 0) return 1.0;
    
    // Higher confidence for more keyword matches
    const unsafeWeight = 0.8;
    const moderateWeight = 0.4;
    
    const score = (unsafeKeywords.length * unsafeWeight + moderateKeywords.length * moderateWeight) / totalKeywords;
    return Math.max(0, 1 - score);
  }

  private checkPromptSpecific(prompt: string): ContentFilterResult {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for AI-specific unsafe patterns
    const aiUnsafePatterns = [
      'nude person', 'naked body', 'explicit content', 'sexual act',
      'violent scene', 'bloody', 'gory', 'weapon', 'dead body',
      'hate symbol', 'offensive gesture'
    ];

    const foundPatterns = aiUnsafePatterns.filter(pattern => 
      lowerPrompt.includes(pattern)
    );

    return {
      isSafe: foundPatterns.length === 0,
      confidence: foundPatterns.length === 0 ? 1.0 : 0.3,
      categories: foundPatterns,
      details: {
        aiUnsafePatterns: foundPatterns,
        promptLength: prompt.length
      }
    };
  }

  async validateGenerationRequest(prompt: string, negativePrompt?: string): Promise<{
    isValid: boolean;
    reason?: string;
    filterResult: ContentFilterResult;
  }> {
    const promptResult = await this.filterPrompt(prompt);
    
    let negativeResult: ContentFilterResult | null = null;
    if (negativePrompt) {
      negativeResult = await this.filterText(negativePrompt);
    }

    const isValid = promptResult.isSafe && (!negativeResult || negativeResult.isSafe);
    const reason = !isValid ? 'Content flagged as potentially unsafe' : undefined;

    return {
      isValid,
      reason,
      filterResult: promptResult
    };
  }
}
