import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocalizationContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

interface LocalizationProviderProps {
  children: React.ReactNode;
  defaultLocale?: string;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
  defaultLocale = 'en'
}) => {
  const [locale, setLocale] = useState(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved) {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key: string, params?: Record<string, string>): string => {
    const translations = getTranslations(locale);
    let text = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    
    return text;
  };

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

const getTranslations = (locale: string) => {
  const translations: Record<string, Record<string, string>> = {
    en: {
      'storyboard.upload': 'Upload Script',
      'storyboard.generate': 'Generate Storyboard',
      'storyboard.export': 'Export',
      'shot.planning': 'Shot Planning',
      'dialogue.timing': 'Dialogue Timing',
      'frame.generation': 'Frame Generation',
      'animatic.creation': 'Animatic Creation',
      'status.processing': 'Processing...',
      'status.completed': 'Completed',
      'status.error': 'Error',
      'button.generate': 'Generate',
      'button.regenerate': 'Regenerate',
      'button.delete': 'Delete',
      'button.cancel': 'Cancel',
      'button.save': 'Save',
      'button.export': 'Export',
      'timeline.current': 'Current: {time}',
      'timeline.total': 'Total: {duration}',
      'frame.count': '{count} frames',
      'shot.count': '{count} shots',
      'scene.count': '{count} scenes',
      'accessibility.highContrast': 'High Contrast Mode',
      'accessibility.normalContrast': 'Normal Contrast Mode',
      'accessibility.toggleContrast': 'Toggle contrast mode',
      'accessibility.timelineNavigation': 'Timeline navigation',
      'accessibility.previousItem': 'Previous item',
      'accessibility.nextItem': 'Next item',
      'accessibility.currentItem': 'Current item: {item}',
      'accessibility.frameDescription': 'Frame showing {description}',
      'accessibility.shotDescription': 'Shot: {description}',
      'accessibility.sceneDescription': 'Scene: {description}',
      'accessibility.progress': 'Progress: {percent}% complete',
      'accessibility.status': 'Status: {status}',
      'accessibility.loading': 'Loading...',
      'accessibility.error': 'Error occurred',
      'accessibility.success': 'Operation completed successfully',
      'accessibility.warning': 'Warning',
      'accessibility.info': 'Information',
      'accessibility.close': 'Close',
      'accessibility.open': 'Open',
      'accessibility.menu': 'Menu',
      'accessibility.search': 'Search',
      'accessibility.filter': 'Filter',
      'accessibility.sort': 'Sort',
      'accessibility.refresh': 'Refresh',
      'accessibility.help': 'Help',
      'accessibility.settings': 'Settings',
      'accessibility.profile': 'Profile',
      'accessibility.logout': 'Logout',
      'accessibility.login': 'Login',
      'accessibility.register': 'Register',
      'accessibility.forgotPassword': 'Forgot Password',
      'accessibility.resetPassword': 'Reset Password',
      'accessibility.changePassword': 'Change Password',
      'accessibility.editProfile': 'Edit Profile',
      'accessibility.viewProfile': 'View Profile',
      'accessibility.notifications': 'Notifications',
      'accessibility.messages': 'Messages',
      'accessibility.favorites': 'Favorites',
      'accessibility.history': 'History',
      'accessibility.download': 'Download',
      'accessibility.upload': 'Upload',
      'accessibility.share': 'Share',
      'accessibility.print': 'Print',
      'accessibility.email': 'Email',
      'accessibility.copy': 'Copy',
      'accessibility.paste': 'Paste',
      'accessibility.cut': 'Cut',
      'accessibility.undo': 'Undo',
      'accessibility.redo': 'Redo',
      'accessibility.selectAll': 'Select All',
      'accessibility.clear': 'Clear',
      'accessibility.reset': 'Reset',
      'accessibility.submit': 'Submit',
      'accessibility.confirm': 'Confirm',
      'accessibility.decline': 'Decline',
      'accessibility.accept': 'Accept',
      'accessibility.reject': 'Reject',
      'accessibility.approve': 'Approve',
      'accessibility.deny': 'Deny',
      'accessibility.enable': 'Enable',
      'accessibility.disable': 'Disable',
      'accessibility.show': 'Show',
      'accessibility.hide': 'Hide',
      'accessibility.expand': 'Expand',
      'accessibility.collapse': 'Collapse',
      'accessibility.minimize': 'Minimize',
      'accessibility.maximize': 'Maximize',
      'accessibility.restore': 'Restore',
      'accessibility.fullscreen': 'Fullscreen',
      'accessibility.exitFullscreen': 'Exit Fullscreen',
      'accessibility.zoomIn': 'Zoom In',
      'accessibility.zoomOut': 'Zoom Out',
      'accessibility.zoomReset': 'Reset Zoom',
      'accessibility.rotate': 'Rotate',
      'accessibility.flip': 'Flip',
      'accessibility.crop': 'Crop',
      'accessibility.resize': 'Resize',
      'accessibility.move': 'Move',
      'accessibility.drag': 'Drag',
      'accessibility.drop': 'Drop',
      'accessibility.scroll': 'Scroll',
      'accessibility.swipe': 'Swipe',
      'accessibility.tap': 'Tap',
      'accessibility.doubleTap': 'Double Tap',
      'accessibility.longPress': 'Long Press',
      'accessibility.pinch': 'Pinch',
      'accessibility.spread': 'Spread',
      'accessibility.shake': 'Shake',
      'accessibility.tilt': 'Tilt',
      'accessibility.rotate': 'Rotate',
      'accessibility.accelerometer': 'Accelerometer',
      'accessibility.gyroscope': 'Gyroscope',
      'accessibility.compass': 'Compass',
      'accessibility.gps': 'GPS',
      'accessibility.camera': 'Camera',
      'accessibility.microphone': 'Microphone',
      'accessibility.speaker': 'Speaker',
      'accessibility.headphones': 'Headphones',
      'accessibility.bluetooth': 'Bluetooth',
      'accessibility.wifi': 'WiFi',
      'accessibility.cellular': 'Cellular',
      'accessibility.battery': 'Battery',
      'accessibility.charging': 'Charging',
      'accessibility.pluggedIn': 'Plugged In',
      'accessibility.unplugged': 'Unplugged',
      'accessibility.lowBattery': 'Low Battery',
      'accessibility.criticalBattery': 'Critical Battery',
      'accessibility.volume': 'Volume',
      'accessibility.mute': 'Mute',
      'accessibility.unmute': 'Unmute',
      'accessibility.brightness': 'Brightness',
      'accessibility.contrast': 'Contrast',
      'accessibility.saturation': 'Saturation',
      'accessibility.hue': 'Hue',
      'accessibility.temperature': 'Temperature',
      'accessibility.sharpness': 'Sharpness',
      'accessibility.blur': 'Blur',
      'accessibility.noise': 'Noise',
      'accessibility.grain': 'Grain',
      'accessibility.vignette': 'Vignette',
      'accessibility.fade': 'Fade',
      'accessibility.transition': 'Transition',
      'accessibility.animation': 'Animation',
      'accessibility.effect': 'Effect',
      'accessibility.filter': 'Filter',
      'accessibility.layer': 'Layer',
      'accessibility.mask': 'Mask',
      'accessibility.blend': 'Blend',
      'accessibility.opacity': 'Opacity',
      'accessibility.transparency': 'Transparency',
      'accessibility.alpha': 'Alpha',
      'accessibility.channel': 'Channel',
      'accessibility.color': 'Color',
      'accessibility.palette': 'Palette',
      'accessibility.swatch': 'Swatch',
      'accessibility.gradient': 'Gradient',
      'accessibility.pattern': 'Pattern',
      'accessibility.texture': 'Texture',
      'accessibility.material': 'Material',
      'accessibility.surface': 'Surface',
      'accessibility.lighting': 'Lighting',
      'accessibility.shadow': 'Shadow',
      'accessibility.highlight': 'Highlight',
      'accessibility.reflection': 'Reflection',
      'accessibility.refraction': 'Refraction',
      'accessibility.diffraction': 'Diffraction',
      'accessibility.interference': 'Interference',
      'accessibility.polarization': 'Polarization',
      'accessibility.dispersion': 'Dispersion',
      'accessibility.absorption': 'Absorption',
      'accessibility.emission': 'Emission',
      'accessibility.fluorescence': 'Fluorescence',
      'accessibility.phosphorescence': 'Phosphorescence',
      'accessibility.chemiluminescence': 'Chemiluminescence',
      'accessibility.bioluminescence': 'Bioluminescence',
      'accessibility.radioluminescence': 'Radioluminescence',
      'accessibility.sonoluminescence': 'Sonoluminescence',
      'accessibility.triboluminescence': 'Triboluminescence',
      'accessibility.crystalloluminescence': 'Crystalloluminescence',
      'accessibility.electroluminescence': 'Electroluminescence',
      'accessibility.cathodoluminescence': 'Cathodoluminescence',
      'accessibility.photoluminescence': 'Photoluminescence',
      'accessibility.thermoluminescence': 'Thermoluminescence',
      'accessibility.mechanoluminescence': 'Mechanoluminescence',
      'accessibility.cryoluminescence': 'Cryoluminescence',
      'accessibility.piezoluminescence': 'Piezoluminescence',
      'accessibility.fractoluminescence': 'Fractoluminescence',
      'accessibility.lyoluminescence': 'Lyoluminescence',
      'accessibility.candoluminescence': 'Candoluminescence',
      'accessibility.radioluminescence': 'Radioluminescence',
      'accessibility.sonoluminescence': 'Sonoluminescence',
      'accessibility.triboluminescence': 'Triboluminescence',
      'accessibility.crystalloluminescence': 'Crystalloluminescence',
      'accessibility.electroluminescence': 'Electroluminescence',
      'accessibility.cathodoluminescence': 'Cathodoluminescence',
      'accessibility.photoluminescence': 'Photoluminescence',
      'accessibility.thermoluminescence': 'Thermoluminescence',
      'accessibility.mechanoluminescence': 'Mechanoluminescence',
      'accessibility.cryoluminescence': 'Cryoluminescence',
      'accessibility.piezoluminescence': 'Piezoluminescence',
      'accessibility.fractoluminescence': 'Fractoluminescence',
      'accessibility.lyoluminescence': 'Lyoluminescence',
      'accessibility.candoluminescence': 'Candoluminescence'
    },
    es: {
      'storyboard.upload': 'Subir Guión',
      'storyboard.generate': 'Generar Storyboard',
      'storyboard.export': 'Exportar',
      'shot.planning': 'Planificación de Toma',
      'dialogue.timing': 'Temporización de Diálogo',
      'frame.generation': 'Generación de Frame',
      'animatic.creation': 'Creación de Animática',
      'status.processing': 'Procesando...',
      'status.completed': 'Completado',
      'status.error': 'Error',
      'button.generate': 'Generar',
      'button.regenerate': 'Regenerar',
      'button.delete': 'Eliminar',
      'button.cancel': 'Cancelar',
      'button.save': 'Guardar',
      'button.export': 'Exportar'
    },
    fr: {
      'storyboard.upload': 'Télécharger le Scénario',
      'storyboard.generate': 'Générer le Storyboard',
      'storyboard.export': 'Exporter',
      'shot.planning': 'Planification de Plan',
      'dialogue.timing': 'Synchronisation de Dialogue',
      'frame.generation': 'Génération de Frame',
      'animatic.creation': 'Création d\'Animatique',
      'status.processing': 'Traitement...',
      'status.completed': 'Terminé',
      'status.error': 'Erreur',
      'button.generate': 'Générer',
      'button.regenerate': 'Régénérer',
      'button.delete': 'Supprimer',
      'button.cancel': 'Annuler',
      'button.save': 'Enregistrer',
      'button.export': 'Exporter'
    }
  };

  return translations[locale] || translations.en;
};
