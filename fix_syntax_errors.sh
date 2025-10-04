#!/bin/bash
# 修复Python脚本造成的语法错误

files=(
    "app/components/views/TextBoxModal.tsx"
    "app/screens/CharacterEditorScreen.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file.backup" ]; then
        cp "$file.backup" "$file"
        echo "已恢复: $file"
    fi
done
