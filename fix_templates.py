"""Fix Angular component files where template backticks got stripped by PowerShell heredoc."""
import os
import re
import glob

base = r"c:\Users\Sivak\Documents\NEARBITE\admin\nearbite-admin-pov\src\app\features"
pattern = os.path.join(base, "**", "*.component.ts")
files = glob.glob(pattern, recursive=True)

fixed = 0
skipped = 0

for fpath in files:
    with open(fpath, "r", encoding="utf-8") as fp:
        content = fp.read()

    # Only process files where template has no backtick (broken)
    # Pattern: "  template: \n<" means the backtick is missing
    if not re.search(r"template: \n<", content):
        skipped += 1
        continue

    original = content

    # 1. Add opening backtick: "template: \n" -> "template: `\n"
    content = re.sub(r"(  template: )\n(<)", r"\1`\n\2", content)

    # 2. Add closing backtick: the template ends just before "  ,\n  styles:"
    # The broken pattern has: "\n</div>\n  ,\n  styles: ["
    content = re.sub(r"(\n</div>\n)  ,\n  styles: \[", r"\1  `,\n  styles: [", content)

    # 3. Fix styles array backtick wrapping: styles: [.page { ... }] -> styles: [`...`]
    # Pattern: styles: [.page { ... }] (broken - no backticks around CSS)
    def fix_styles(m):
        css = m.group(1)
        if not css.startswith("`"):
            return "styles: [`" + css + "`]"
        return m.group(0)
    content = re.sub(r"styles: \[([^\`\]]+)\]", fix_styles, content)

    if content != original:
        with open(fpath, "w", encoding="utf-8") as fp:
            fp.write(content)
        print(f"FIXED: {os.path.basename(fpath)}")
        fixed += 1
    else:
        print(f"UNCHANGED: {os.path.basename(fpath)}")

print(f"\nDone. Fixed: {fixed}, Skipped (already OK): {skipped}")
