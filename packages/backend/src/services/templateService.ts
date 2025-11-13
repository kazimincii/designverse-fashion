// Story templates service

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  clipCount: number;
  clips: TemplateClip[];
  defaultMusic?: string;
  targetDuration: number;
}

export interface TemplateClip {
  index: number;
  promptTemplate: string;
  duration: number;
  cameraMovement?: string;
  textOverlay?: {
    content: string;
    position: string;
  };
}

// Built-in templates
export const BUILTIN_TEMPLATES: StoryTemplate[] = [
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Perfect for showing off your product from multiple angles',
    category: 'marketing',
    clipCount: 5,
    targetDuration: 25,
    clips: [
      {
        index: 0,
        promptTemplate: 'Wide shot of {{product}} on elegant display, studio lighting, soft shadows',
        duration: 5,
        cameraMovement: 'static',
        textOverlay: {
          content: 'Introducing {{productName}}',
          position: 'bottom',
        },
      },
      {
        index: 1,
        promptTemplate: 'Close-up of {{product}} details, cinematic lighting, shallow depth of field',
        duration: 5,
        cameraMovement: 'slow zoom in',
      },
      {
        index: 2,
        promptTemplate: '{{product}} in action, dynamic movement, professional setting',
        duration: 5,
        cameraMovement: 'dolly shot',
      },
      {
        index: 3,
        promptTemplate: 'Multiple angles of {{product}}, rotating display, clean background',
        duration: 5,
        cameraMovement: 'orbital',
      },
      {
        index: 4,
        promptTemplate: '{{product}} with brand logo, premium presentation, fade to white',
        duration: 5,
        cameraMovement: 'static',
        textOverlay: {
          content: 'Available Now',
          position: 'center',
        },
      },
    ],
  },
  {
    id: 'travel-montage',
    name: 'Travel Montage',
    description: 'Showcase beautiful destinations and travel experiences',
    category: 'lifestyle',
    clipCount: 6,
    targetDuration: 30,
    clips: [
      {
        index: 0,
        promptTemplate: 'Aerial view of {{destination}}, golden hour lighting, sweeping camera movement',
        duration: 5,
        cameraMovement: 'drone flyover',
      },
      {
        index: 1,
        promptTemplate: 'Iconic landmark at {{destination}}, tourists walking, bright daylight',
        duration: 5,
        cameraMovement: 'pan',
      },
      {
        index: 2,
        promptTemplate: 'Local street scene at {{destination}}, vibrant colors, cultural atmosphere',
        duration: 5,
        cameraMovement: 'tracking shot',
      },
      {
        index: 3,
        promptTemplate: 'Beautiful nature scene at {{destination}}, dramatic landscape, wide angle',
        duration: 5,
        cameraMovement: 'static',
      },
      {
        index: 4,
        promptTemplate: 'Sunset at {{destination}}, silhouettes, warm colors',
        duration: 5,
        cameraMovement: 'slow pan',
      },
      {
        index: 5,
        promptTemplate: 'Night scene at {{destination}}, city lights, time-lapse effect',
        duration: 5,
        cameraMovement: 'static',
      },
    ],
  },
  {
    id: 'explainer-video',
    name: 'Explainer Video',
    description: 'Explain concepts, processes, or ideas clearly',
    category: 'education',
    clipCount: 4,
    targetDuration: 20,
    clips: [
      {
        index: 0,
        promptTemplate: 'Clean minimal background, text: {{title}}, modern design',
        duration: 5,
        cameraMovement: 'static',
        textOverlay: {
          content: '{{title}}',
          position: 'center',
        },
      },
      {
        index: 1,
        promptTemplate: 'Visual representation of {{concept1}}, animated elements, clear graphics',
        duration: 5,
        cameraMovement: 'zoom',
        textOverlay: {
          content: '{{concept1}}',
          position: 'bottom',
        },
      },
      {
        index: 2,
        promptTemplate: 'Visual representation of {{concept2}}, step-by-step progression',
        duration: 5,
        cameraMovement: 'pan',
        textOverlay: {
          content: '{{concept2}}',
          position: 'bottom',
        },
      },
      {
        index: 3,
        promptTemplate: 'Summary visual with key points, clean layout, professional finish',
        duration: 5,
        cameraMovement: 'static',
        textOverlay: {
          content: 'Learn More',
          position: 'center',
        },
      },
    ],
  },
];

export const templateService = {
  // Get all templates
  getAllTemplates(): StoryTemplate[] {
    return BUILTIN_TEMPLATES;
  },

  // Get template by ID
  getTemplateById(id: string): StoryTemplate | undefined {
    return BUILTIN_TEMPLATES.find((t) => t.id === id);
  },

  // Get templates by category
  getTemplatesByCategory(category: string): StoryTemplate[] {
    return BUILTIN_TEMPLATES.filter((t) => t.category === category);
  },

  // Fill template with user data
  fillTemplate(template: StoryTemplate, variables: Record<string, string>): StoryTemplate {
    const filledClips = template.clips.map((clip) => {
      let prompt = clip.promptTemplate;

      // Replace variables in prompt
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        prompt = prompt.replace(regex, value);
      });

      const filledClip = { ...clip, promptTemplate: prompt };

      // Replace variables in text overlay
      if (clip.textOverlay) {
        let overlayContent = clip.textOverlay.content;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          overlayContent = overlayContent.replace(regex, value);
        });
        filledClip.textOverlay = {
          ...clip.textOverlay,
          content: overlayContent,
        };
      }

      return filledClip;
    });

    return {
      ...template,
      clips: filledClips,
    };
  },
};
