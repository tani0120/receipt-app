
import os

def rename_and_replace(root_dir):
    # First pass: Rename files and directories
    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=False):
        # Rename files
        for filename in filenames:
            if filename.startswith('aaa_'):
                old_path = os.path.join(dirpath, filename)
                new_filename = filename.replace('aaa_', '')
                new_path = os.path.join(dirpath, new_filename)
                print(f"Renaming: {old_path} -> {new_path}")
                os.rename(old_path, new_path)
        
        # Rename directories
        for dirname in dirnames:
            if dirname.startswith('aaa_') or dirname == 'aaa': # Handle 'aaa' dir if it still exists or similar
                old_path = os.path.join(dirpath, dirname)
                new_dirname = dirname.replace('aaa_', '')
                if new_dirname == 'aaa': new_dirname = 'temp_aaa' # Just in case
                new_path = os.path.join(dirpath, new_dirname)
                print(f"Renaming Dir: {old_path} -> {new_path}")
                os.rename(old_path, new_path)

    # Second pass: Replace content in text files
    # Also replace import paths like '@/aaa/aaa_components' -> '@/components'
    # And 'aaa_ScreenA' -> 'ScreenA'
    
    extensions = ['.ts', '.js', '.vue', '.json', '.html', '.md']
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if any(filename.endswith(ext) for ext in extensions):
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # 1. Replace path imports references
                    # e.g. @/aaa/aaa_components -> @/components
                    content = content.replace('@/aaa/aaa_', '@/')
                    content = content.replace('@/aaa/', '@/')
                    
                    # 2. Replace simple file references
                    # e.g. import ... from './aaa_helper' -> './helper'
                    content = content.replace('/aaa_', '/')
                    
                    # 3. Replace component names / symbol names if they had prefix in code
                    # This is riskier but necessary if class names or IDs used aaa_
                    # logical replacements:
                    content = content.replace('aaa_Screen', 'Screen')
                    content = content.replace('aaa_use', 'use')
                    content = content.replace("from 'aaa_", "from '")
                    content = content.replace('import aaa_', 'import ') # careful
                    
                    # Specific replacement for known internal component refs
                    # AaaLayout -> Layout ? (maybe not AaaLayout is unique)
                    # content = content.replace('AaaLayout', 'MainLayout') # decided to keep AaaLayout name if it's the class name, but file is Layout.vue

                    # Let's stick to safe path/filename replacements first.
                    # The instruction "aaa_プレフィックスの排除" implies identifiers too? 
                    # Usually just files and imports.
                    # "aaa_ScreenA" -> "ScreenA" in code references.
                    
                    content = content.replace('aaa_Screen', 'Screen')
                    content = content.replace('aaa_components', 'components')
                    content = content.replace('aaa_composables', 'composables')
                    content = content.replace('aaa_types', 'types')
                    content = content.replace('aaa_services', 'services')
                    content = content.replace('aaa_utils', 'utils')
                    content = content.replace('aaa_views', 'views')
                    content = content.replace('aaa_router', 'router')
                    content = content.replace('aaa_assets', 'assets')
                    
                    # Fix index.html specific update
                    if filename == 'index.html':
                        content = content.replace('/src/aaa/aaa_main.ts', '/src/main.ts')

                    if content != original_content:
                        print(f"Modifying content: {file_path}")
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)

                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    target_dir = r"c:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\src"
    root_html = r"c:\Users\kazen\OneDrive\デスクトップ\ai_gogleanti\index.html"
    
    rename_and_replace(target_dir)
    
    # Process index.html separately as it is outside src
    if os.path.exists(root_html):
         with open(root_html, 'r', encoding='utf-8') as f:
            c = f.read()
         c = c.replace('/src/aaa/aaa_main.ts', '/src/main.ts')
         with open(root_html, 'w', encoding='utf-8') as f:
            f.write(c)
         print("Updated index.html")

