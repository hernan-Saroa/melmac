import json  
with open('frontend/angular.json', 'r') as f: data = json.load(f)  
data['projects']['ngx-admin-demo']['architect']['build']['options']['stylePreprocessorOptions'] = {'includePaths': ['node_modules']}  
data['projects']['ngx-admin-demo']['architect']['test']['options']['stylePreprocessorOptions'] = {'includePaths': ['node_modules']}  
with open('frontend/angular.json', 'w') as f: json.dump(data, f, indent=2)  
