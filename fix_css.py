import re  
f = open('frontend/src/app/login-new/login-new.component.scss', 'r', encoding='utf-8')  
content = f.read()  
f.close()  
new_css = '''  
/* FLOATING LABELS */  
.floating-group {  
  position: relative;  
  margin-bottom: 1.5rem;  
}  
.floating-input {  
  padding: 0.85rem 1rem !important;  
  background-color: transparent !important;  
  z-index: 2;  
}  
.floating-label {  
  position: absolute;  
  top: 50%;  
  left: 0.8rem;  
  transform: translateY(-50%);  
  font-family: 'Inter', sans-serif;  
  font-size: 1rem;  
  color: #6b7280;  
  pointer-events: none;  
  transition: all 0.2s ease-out;  
  margin: 0;  
  z-index: 3;  
  padding: 0 4px;  
}  
.floating-input:focus ~ .floating-label,  
.floating-input:not(:placeholder-shown) ~ .floating-label {  
  top: 0;  
  font-size: 0.8rem;  
  color: #509180;  
  background-color: #ffffff;  
}  
'''  
content = re.sub(r'/\* FLOATING LABELS \*/.*', new_css.strip(), content, flags=re.DOTALL)  
f = open('frontend/src/app/login-new/login-new.component.scss', 'w', encoding='utf-8')  
f.write(content)  
f.close()  
