import React, { useEffect, useRef, useState } from 'react'
import { DUMMY_RESUME_DATA, resumeTemplates} from '../utils/data'
import { TemplateCard } from './Cards'
import Tabs from './Tabs';
import RenderResume from './RenderResume';
import { Check } from 'lucide-react';

const TAB_DATA = [{label: 'Templates'}]

const ThemeSelector = ({selectedTheme, setSelectedTheme, resumeData, onClose}) => {

    const resumeRef = useRef(null)
    const [baseWidth, setBaseWidth] = useState(800);
    
    const initialIndex = resumeTemplates.findIndex(t => t.id === selectedTheme)
    const [selectedTemplate, setSelectedTemplate] = useState({
        theme: selectedTheme || resumeTemplates[0]?.id || '',
        index: initialIndex >= 0 ? initialIndex : 0
    }) 

    const [tabValue, setTabValue] = useState('Templates')

    const handleThemeSelection = () => {
        setSelectedTheme(selectedTemplate.theme)
        onClose()
    }

    const updateBaseWidth = () => {
        if (resumeRef.current) {
            setBaseWidth(resumeRef.current.offsetWidth)
        }
    } 

    useEffect(() => {
      updateBaseWidth()
      window.addEventListener('resize', updateBaseWidth)
          return () => {
        window.removeEventListener('resize', updateBaseWidth)
      }
    }, [])
    

  return (
    <div className='max-w-7xl mx-auto px-4'>
    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8
    p-4 sm:p-6 bg-gradient-to-r from-white to-violet-50 rounded-2xl border border-violet-100'>

        <Tabs tabs={TAB_DATA} activeTab={tabValue} setActiveTab={setTabValue} />

        <button className='w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-2xl hover:scale-105
        transition-all shadow-lg hover:shxl
        ' onClick={handleThemeSelection}>  
            <Check size={18}/> Apply Changes
        </button>
    </div>
    <div className='grid grid-cols-1 lg:grid-cols-5 gap-6lg:gap-8'>
        <div className='lg:col-span-2 bg-white rounded-2xl border-gray-100 p-4 sm:p-6'>
            <div className='grid gird-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] lg:m-h-[70vh]
            overflow-auto p-2'>
                        {resumeTemplates.map((template, index) => (
                            <TemplateCard key={`templates_${index}`}
                            thumnailImg={template.thumbnailImg}
                            isSelected={selectedTemplate.index === index}
                            onSelect={() => setSelectedTemplate({
                                theme: template.id,
                                index
                            })}
                            />
                        ))}
            </div>
        </div>

        <div className='lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6' ref={resumeRef}>
            <RenderResume templateId={selectedTemplate?.theme || ''}
            resumeData={resumeData || DUMMY_RESUME_DATA}
            containerWidth={baseWidth}
            />

        </div>
    </div>
    </div>
  )
}

export default ThemeSelector