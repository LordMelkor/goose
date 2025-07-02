import { useEffect, useState } from 'react';
import { all_response_styles, ResponseStyleSelectionItem } from './ResponseStyleSelectionItem';
import { Switch } from '../../ui/switch';
import { getLocalStorageBoolean, setLocalStorageBoolean, getLocalStorageItem, setLocalStorageItem } from '../../../utils/localStorage';

export const ResponseStylesSection = () => {
  const [currentStyle, setCurrentStyle] = useState('concise');
  const [showExtensionNames, setShowExtensionNames] = useState(false);

  useEffect(() => {
    const savedStyle = getLocalStorageItem('response_style', 'concise');
    if (savedStyle) {
      try {
        setCurrentStyle(savedStyle);
      } catch (error) {
        console.error('Error parsing response style:', error);
      }
    } else {
      // Set default to concise for new users
      setLocalStorageItem('response_style', 'concise');
      setCurrentStyle('concise');
    }
  }, []);

  // Load show extension names setting
  useEffect(() => {
    const showNames = getLocalStorageBoolean('show_extension_names', false);
    setShowExtensionNames(showNames);
  }, []);

  const handleStyleChange = async (newStyle: string) => {
    setCurrentStyle(newStyle);
    setLocalStorageItem('response_style', newStyle);
  };

  const handleShowExtensionNamesToggle = (checked: boolean) => {
    setShowExtensionNames(checked);
    setLocalStorageBoolean('show_extension_names', checked);
  };

  return (
    <section id="responseStyles" className="px-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-medium text-textStandard">Response Styles</h2>
      </div>
      <div className="border-b border-borderSubtle pb-8">
        <p className="text-sm text-textStandard mb-6">
          Choose how Goose should format and style its responses
        </p>
        <div>
          {all_response_styles.map((style) => (
            <ResponseStyleSelectionItem
              key={style.key}
              style={style}
              currentStyle={currentStyle}
              showDescription={true}
              handleStyleChange={handleStyleChange}
            />
          ))}
        </div>

        {/* Extension Names Toggle */}
        <div className="flex items-center justify-between mt-6">
          <div>
            <h3 className="text-textStandard">Show Extension Names</h3>
            <p className="text-xs text-textSubtle max-w-md mt-[2px]">
              Display extension names in tool call banners (e.g., "[Extension: developer] writing file.py")
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              checked={showExtensionNames}
              onCheckedChange={handleShowExtensionNamesToggle}
              variant="mono"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
