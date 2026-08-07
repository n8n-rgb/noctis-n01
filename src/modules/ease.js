import gsap from 'gsap';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/**
 * Two curves for the whole page. Entrances ease out hard, exits ease in hard.
 * Nothing on this site is linear.
 */
export const ENTER = CustomEase.create('enter', 'M0,0 C0.16,1 0.3,1 1,1'); // cubic-bezier(0.16, 1, 0.3, 1)
export const EXIT = CustomEase.create('exit', 'M0,0 C0.7,0 0.84,0 1,1'); // cubic-bezier(0.7, 0, 0.84, 0)
