/**
 * Animated splash screens for Bibble using chalk-animation ✨
 * 
 * This module extends the existing splash system with beautiful animations
 * perfect for the GitHub hackathon's "Terminal Talent" category!
 */

import chalkAnimation from 'chalk-animation';
import { ASCII_BANNERS, BannerOptions } from './splash.js';
import { theme } from './theme.js';
import { brandSymbols } from './symbols.js';
import { safeGradient } from '../tools/built-in/utilities/text.js';
import { gradient } from './gradient.js';

/**
 * Animation types available from chalk-animation
 */
export type AnimationType = 'rainbow' | 'pulse' | 'glitch' | 'radar' | 'neon' | 'karaoke';

/**
 * Animation configuration options
 */
export interface AnimationOptions {
  type: AnimationType;
  duration?: number; // Duration in ms, default is Infinity (until stopped)
  speed?: number; // Animation speed multiplier, default is 1
  text: string;
}

/**
 * Enhanced banner options with animation support
 */
export interface AnimatedBannerOptions extends BannerOptions {
  animation?: {
    type: AnimationType;
    duration?: number;
    speed?: number;
    delay?: number; // Delay before starting animation
  };
}

/**
 * Animated splash screen generator class
 */
export class AnimatedSplash {
  private static activeAnimations: Set<any> = new Set();

  /**
   * Create an animated BIBBLE banner
   */
  static createAnimatedBanner(options: AnimatedBannerOptions = {}): any {
    const {
      animation = { type: 'rainbow', duration: 2000, speed: 1 },
      subtitle = 'Your personal AI assistant that lives in your terminal ✨',
      showVersion = true,
    } = options;

    // Get the BIBBLE ASCII banner
    const bannerText = ASCII_BANNERS.BIBBLE;
    
    // Create the animated banner
    const animatedBanner = chalkAnimation[animation.type](
      bannerText, 
      animation.speed || 1
    );

    // Store reference to stop later if needed
    AnimatedSplash.activeAnimations.add(animatedBanner);

    // Stop animation after duration if specified
    if (animation.duration && animation.duration !== Infinity) {
      setTimeout(() => {
        animatedBanner.stop();
        AnimatedSplash.activeAnimations.delete(animatedBanner);
        
        // Show static content after animation
        console.log('\n');
        if (subtitle) {
          console.log(theme.dim(subtitle));
        }
        if (showVersion) {
          console.log(theme.info('✨ Version 1.9.0'));
        }
        console.log(theme.accent('\n💡 Type /help for chat commands\n'));
      }, animation.duration);
    }

    return animatedBanner;
  }

  /**
   * Create animated welcome sequence with multiple stages
   */
  static async createWelcomeSequence(options: {
    showBanner?: boolean;
    bannerAnimation?: AnimationType;
    showTitle?: boolean;
    titleAnimation?: AnimationType;
    showSubtitle?: boolean;
    delays?: {
      banner?: number;
      title?: number;
      subtitle?: number;
    };
  } = {}): Promise<void> {
    const {
      showBanner = true,
      bannerAnimation = 'rainbow',
      showTitle = true,
      titleAnimation = 'neon',
      showSubtitle = true,
      delays = { banner: 0, title: 2500, subtitle: 4000 }
    } = options;

    console.clear();

    // Stage 1: Animated BIBBLE banner
    if (showBanner) {
      setTimeout(() => {
        const banner = chalkAnimation[bannerAnimation](ASCII_BANNERS.BIBBLE, 1.5);
        AnimatedSplash.activeAnimations.add(banner);
        
        // Stop banner animation after 2 seconds
        setTimeout(() => {
          banner.stop();
          AnimatedSplash.activeAnimations.delete(banner);
        }, 2000);
      }, delays.banner || 0);
    }

    // Stage 2: Animated title/subtitle
    if (showTitle) {
      setTimeout(() => {
        const title = chalkAnimation[titleAnimation](
          `${brandSymbols.sparkles} Welcome to Bibble ${brandSymbols.sparkles}`, 
          2
        );
        AnimatedSplash.activeAnimations.add(title);
        
        setTimeout(() => {
          title.stop();
          AnimatedSplash.activeAnimations.delete(title);
        }, 1500);
      }, delays.title || 2500);
    }

    // Stage 3: Final static content
    if (showSubtitle) {
      setTimeout(() => {
        console.log(theme.dim('\nYour personal AI assistant that lives in your terminal'));
        console.log(theme.info('✨ Version 1.9.0'));
        console.log(theme.accent('\n💡 Type /help for chat commands'));
        console.log(theme.dim('\n🚀 Ready for magic!\n'));
      }, delays.subtitle || 4000);
    }
  }

  /**
   * Create animated loading sequence
   */
  static createAnimatedLoading(
    message: string = 'Initializing Bibble', 
    animation: AnimationType = 'pulse'
  ): any {
    const dots = '...';
    const animatedText = chalkAnimation[animation](`${message}${dots}`, 1);
    AnimatedSplash.activeAnimations.add(animatedText);
    
    return {
      stop: () => {
        animatedText.stop();
        AnimatedSplash.activeAnimations.delete(animatedText);
      },
      replace: (newText: string) => {
        animatedText.replace(`${newText}${dots}`);
      },
      complete: (successMessage: string = 'Ready!') => {
        animatedText.stop();
        AnimatedSplash.activeAnimations.delete(animatedText);
        console.log(theme.ok(`${brandSymbols.success} ${successMessage}`));
      }
    };
  }

  /**
   * Create animated Pink Pixel signature
   */
  static createAnimatedSignature(duration: number = 3000): any {
    const signature = `${ASCII_BANNERS.PINK_PIXEL}\n\n"Dream it, Pixel it" ✨\nMade with ❤️ by Pink Pixel`;
    
    const animated = chalkAnimation.rainbow(signature, 1);
    AnimatedSplash.activeAnimations.add(animated);
    
    setTimeout(() => {
      animated.stop();
      AnimatedSplash.activeAnimations.delete(animated);
    }, duration);
    
    return animated;
  }

  /**
   * Stop all currently running animations
   */
  static stopAllAnimations(): void {
    AnimatedSplash.activeAnimations.forEach(animation => {
      try {
        animation.stop();
      } catch (e) {
        // Ignore errors when stopping animations
      }
    });
    AnimatedSplash.activeAnimations.clear();
  }

  /**
   * Create quick animated demos for testing
   */
  static async demo(): Promise<void> {
    console.clear();
    console.log(theme.heading('🎭 Bibble Animation Demo\n'));

    // Rainbow demo
    console.log(theme.subheading('🌈 Rainbow Animation:'));
    const rainbow = chalkAnimation.rainbow('Hello from Bibble!', 2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    rainbow.stop();

    // Pulse demo
    console.log(theme.subheading('\n💓 Pulse Animation:'));
    const pulse = chalkAnimation.pulse('Pulse animation!', 1.5);
    await new Promise(resolve => setTimeout(resolve, 2000));
    pulse.stop();

    // Glitch demo
    console.log(theme.subheading('\n⚡ Glitch Animation:'));
    const glitch = chalkAnimation.glitch('Glitch effect!', 1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    glitch.stop();

    // Neon demo
    console.log(theme.subheading('\n💡 Neon Animation:'));
    const neon = chalkAnimation.neon('Neon glow!', 1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    neon.stop();

    // Karaoke demo
    console.log(theme.subheading('\n🎤 Karaoke Animation:'));
    const karaoke = chalkAnimation.karaoke('Karaoke effect reveals text!', 1);
    await new Promise(resolve => setTimeout(resolve, 3000));
    karaoke.stop();

    // Radar demo
    console.log(theme.subheading('\n📡 Radar Animation:'));
    const radar = chalkAnimation.radar('Radar scanning...', 1.5);
    await new Promise(resolve => setTimeout(resolve, 2000));
    radar.stop();

    console.log(theme.ok('\n✨ Animation demo complete!'));
  }

  /**
   * Quick access methods
   */
  static get quick() {
    return {
      rainbow: (text: string, speed = 1) => chalkAnimation.rainbow(text, speed),
      pulse: (text: string, speed = 1) => chalkAnimation.pulse(text, speed),
      glitch: (text: string, speed = 1) => chalkAnimation.glitch(text, speed),
      neon: (text: string, speed = 1) => chalkAnimation.neon(text, speed),
      karaoke: (text: string, speed = 1) => chalkAnimation.karaoke(text, speed),
      radar: (text: string, speed = 1) => chalkAnimation.radar(text, speed),
    };
  }
}

/**
 * Convenient wrapper functions
 */
export const animatedSplash = {
  banner: AnimatedSplash.createAnimatedBanner,
  welcome: AnimatedSplash.createWelcomeSequence,
  loading: AnimatedSplash.createAnimatedLoading,
  signature: AnimatedSplash.createAnimatedSignature,
  demo: AnimatedSplash.demo,
  stopAll: AnimatedSplash.stopAllAnimations,
  quick: AnimatedSplash.quick,
};

/**
 * Export for easy access
 */
export default AnimatedSplash;
