from django.contrib import admin

from api.models import AI_Knowledge_Base

class AIKnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ('keyword', 'field_type_id', 'created_at', 'state')
    search_fields = ('keyword',)
    list_filter = ('state', 'field_type_id')

admin.site.register(AI_Knowledge_Base, AIKnowledgeBaseAdmin)
