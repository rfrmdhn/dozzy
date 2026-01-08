export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    organization_id: string | null
                    role: 'admin' | 'member' | 'guest' | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    organization_id?: string | null
                    role?: 'admin' | 'member' | 'guest' | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    organization_id?: string | null
                    role?: 'admin' | 'member' | 'guest' | null
                    created_at?: string
                    updated_at?: string
                }
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string | null
                    plan: string | null
                    owner_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug?: string | null
                    plan?: string | null
                    owner_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string | null
                    plan?: string | null
                    owner_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            teams: {
                Row: {
                    id: string
                    organization_id: string | null
                    name: string
                    description: string | null
                    privacy: 'public' | 'private' | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id?: string | null
                    name: string
                    description?: string | null
                    privacy?: 'public' | 'private' | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    name?: string
                    description?: string | null
                    privacy?: 'public' | 'private' | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    organization_id: string | null
                    team_id: string | null
                    owner_id: string | null
                    name: string
                    description: string | null
                    status: 'active' | 'on_hold' | 'completed' | 'archived' | null
                    start_date: string | null
                    due_date: string | null
                    icon: string | null
                    color: string | null
                    view_preferences: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id?: string | null
                    team_id?: string | null
                    owner_id?: string | null
                    name: string
                    description?: string | null
                    status?: 'active' | 'on_hold' | 'completed' | 'archived' | null
                    start_date?: string | null
                    due_date?: string | null
                    icon?: string | null
                    color?: string | null
                    view_preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    team_id?: string | null
                    owner_id?: string | null
                    name?: string
                    description?: string | null
                    status?: 'active' | 'on_hold' | 'completed' | 'archived' | null
                    start_date?: string | null
                    due_date?: string | null
                    icon?: string | null
                    color?: string | null
                    view_preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            project_sections: {
                Row: {
                    id: string
                    project_id: string | null
                    name: string
                    order_index: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id?: string | null
                    name: string
                    order_index?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string | null
                    name?: string
                    order_index?: number | null
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    organization_id: string | null
                    title: string
                    description: Json | null
                    status: string | null
                    priority: 'low' | 'medium' | 'high' | 'urgent' | null
                    assignee_id: string | null
                    author_id: string | null
                    start_date: string | null
                    due_date: string | null
                    completed_at: string | null
                    parent_task_id: string | null
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id?: string | null
                    title: string
                    description?: Json | null
                    status?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent' | null
                    assignee_id?: string | null
                    author_id?: string | null
                    start_date?: string | null
                    due_date?: string | null
                    completed_at?: string | null
                    parent_task_id?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    title?: string
                    description?: Json | null
                    status?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent' | null
                    assignee_id?: string | null
                    author_id?: string | null
                    start_date?: string | null
                    due_date?: string | null
                    completed_at?: string | null
                    parent_task_id?: string | null
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            project_tasks: {
                Row: {
                    project_id: string
                    task_id: string
                    section_id: string | null
                    order_index: number | null
                    created_at: string
                }
                Insert: {
                    project_id: string
                    task_id: string
                    section_id?: string | null
                    order_index?: number | null
                    created_at?: string
                }
                Update: {
                    project_id?: string
                    task_id?: string
                    section_id?: string | null
                    order_index?: number | null
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    task_id: string | null
                    user_id: string | null
                    content: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    task_id?: string | null
                    user_id?: string | null
                    content: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string | null
                    user_id?: string | null
                    content?: Json
                    created_at?: string
                    updated_at?: string
                }
            }
            custom_fields: {
                Row: {
                    id: string
                    organization_id: string | null
                    name: string
                    type: 'text' | 'number' | 'currency' | 'percentage' | 'enum' | 'date' | 'boolean' | 'person'
                    config: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id?: string | null
                    name: string
                    type: 'text' | 'number' | 'currency' | 'percentage' | 'enum' | 'date' | 'boolean' | 'person'
                    config?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    name?: string
                    type?: 'text' | 'number' | 'currency' | 'percentage' | 'enum' | 'date' | 'boolean' | 'person'
                    config?: Json | null
                    created_at?: string
                }
            }
            custom_field_values: {
                Row: {
                    id: string
                    custom_field_id: string | null
                    entity_type: 'task' | 'project' | null
                    entity_id: string
                    value: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    custom_field_id?: string | null
                    entity_type?: 'task' | 'project' | null
                    entity_id: string
                    value?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    custom_field_id?: string | null
                    entity_type?: 'task' | 'project' | null
                    entity_id?: string
                    value?: Json | null
                    created_at?: string
                }
            }
            activity_logs: {
                Row: {
                    id: string
                    organization_id: string | null
                    user_id: string | null
                    entity_type: string
                    entity_id: string
                    action: string
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id?: string | null
                    user_id?: string | null
                    entity_type: string
                    entity_id: string
                    action: string
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    user_id?: string | null
                    entity_type?: string
                    entity_id?: string
                    action?: string
                    metadata?: Json | null
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string | null
                    organization_id: string | null
                    event_type: string
                    entity_type: string | null
                    entity_id: string | null
                    payload: Json | null
                    is_read: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    organization_id?: string | null
                    event_type: string
                    entity_type?: string | null
                    entity_id?: string | null
                    payload?: Json | null
                    is_read?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    organization_id?: string | null
                    event_type?: string
                    entity_type?: string | null
                    entity_id?: string | null
                    payload?: Json | null
                    is_read?: boolean | null
                    created_at?: string
                }
            }
        }
        Functions: {
            create_organization_with_owner: {
                Args: {
                    org_name: string
                    owner_id: string
                }
                Returns: string
            }
        }
    }
}
