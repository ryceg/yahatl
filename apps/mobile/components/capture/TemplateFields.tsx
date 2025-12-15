/**
 * TemplateFields Component
 *
 * Renders dynamic form fields based on the selected template type.
 * Each template type has specific fields stored in the note body as JSON.
 */
import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import {
  User,
  Calendar,
  Link2,
  Clock,
  DollarSign,
  Package,
  ChefHat,
  ListOrdered,
} from "lucide-react-native";
import { Input, Badge } from "@/components/ui";
import { TemplateType } from "./TemplateSelector";
import { cn } from "@/lib/utils";

// ============================================================================
// Template Field Types
// ============================================================================

export interface PersonTemplateData {
  birthday?: string;
  relationship?: string;
  email?: string;
  phone?: string;
}

export interface RecipeTemplateData {
  ingredients?: string;
  method?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  sourceUrl?: string;
}

export interface ProjectTemplateData {
  status?: "planning" | "active" | "on-hold" | "completed";
  deadline?: string;
}

export interface GiftIdeaTemplateData {
  recipientNoteId?: string;
  recipientName?: string;
  priceRange?: string;
  purchaseUrl?: string;
  occasion?: string;
}

export interface ShoppingItemTemplateData {
  quantity?: string;
  unit?: string;
  category?: string;
  sourceRecipeId?: string;
}

export type TemplateData =
  | PersonTemplateData
  | RecipeTemplateData
  | ProjectTemplateData
  | GiftIdeaTemplateData
  | ShoppingItemTemplateData
  | Record<string, unknown>;

// ============================================================================
// Component Props
// ============================================================================

interface TemplateFieldsProps {
  templateType: TemplateType;
  data: TemplateData;
  onChange: (data: TemplateData) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateFields({
  templateType,
  data,
  onChange,
  className,
}: TemplateFieldsProps) {
  if (templateType === TemplateType.None) {
    return null;
  }

  return (
    <View className={cn("w-full", className)}>
      <Text className="text-sm font-medium text-foreground mb-3">
        Template Fields
      </Text>
      {templateType === TemplateType.Person && (
        <PersonFields data={data as PersonTemplateData} onChange={onChange} />
      )}
      {templateType === TemplateType.Recipe && (
        <RecipeFields data={data as RecipeTemplateData} onChange={onChange} />
      )}
      {templateType === TemplateType.Project && (
        <ProjectFields data={data as ProjectTemplateData} onChange={onChange} />
      )}
      {templateType === TemplateType.GiftIdea && (
        <GiftIdeaFields
          data={data as GiftIdeaTemplateData}
          onChange={onChange}
        />
      )}
      {templateType === TemplateType.ShoppingItem && (
        <ShoppingItemFields
          data={data as ShoppingItemTemplateData}
          onChange={onChange}
        />
      )}
    </View>
  );
}

// ============================================================================
// Template-Specific Forms
// ============================================================================

interface PersonFieldsProps {
  data: PersonTemplateData;
  onChange: (data: PersonTemplateData) => void;
}

function PersonFields({ data, onChange }: PersonFieldsProps) {
  const updateField = (field: keyof PersonTemplateData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const relationshipOptions = [
    "Family",
    "Friend",
    "Work",
    "Acquaintance",
    "Other",
  ];

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <View className="flex-row items-center gap-2 mb-3">
        <User size={16} color="#7c3aed" />
        <Text className="text-sm font-medium text-foreground">
          Person Details
        </Text>
      </View>

      <Input
        label="Birthday"
        placeholder="YYYY-MM-DD"
        value={data.birthday || ""}
        onChangeText={(text) => updateField("birthday", text)}
        className="mb-3"
      />

      <Text className="text-xs text-muted-foreground mb-2">Relationship</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {relationshipOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateField("relationship", option)}
          >
            <Badge
              variant={data.relationship === option ? "default" : "outline"}
            >
              <Text
                className={cn(
                  "text-xs",
                  data.relationship === option
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {option}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>

      <Input
        label="Email"
        placeholder="email@example.com"
        value={data.email || ""}
        onChangeText={(text) => updateField("email", text)}
        keyboardType="email-address"
        className="mb-3"
      />

      <Input
        label="Phone"
        placeholder="+1 234 567 8900"
        value={data.phone || ""}
        onChangeText={(text) => updateField("phone", text)}
        keyboardType="phone-pad"
      />
    </View>
  );
}

interface RecipeFieldsProps {
  data: RecipeTemplateData;
  onChange: (data: RecipeTemplateData) => void;
}

function RecipeFields({ data, onChange }: RecipeFieldsProps) {
  const updateField = (field: keyof RecipeTemplateData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <View className="flex-row items-center gap-2 mb-3">
        <ChefHat size={16} color="#7c3aed" />
        <Text className="text-sm font-medium text-foreground">
          Recipe Details
        </Text>
      </View>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Input
            label="Prep Time"
            placeholder="15 min"
            value={data.prepTime || ""}
            onChangeText={(text) => updateField("prepTime", text)}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Cook Time"
            placeholder="30 min"
            value={data.cookTime || ""}
            onChangeText={(text) => updateField("cookTime", text)}
          />
        </View>
      </View>

      <Input
        label="Servings"
        placeholder="4"
        value={data.servings || ""}
        onChangeText={(text) => updateField("servings", text)}
        keyboardType="numeric"
        className="mb-3"
      />

      <Input
        label="Source URL"
        placeholder="https://..."
        value={data.sourceUrl || ""}
        onChangeText={(text) => updateField("sourceUrl", text)}
        keyboardType="url"
        className="mb-3"
      />

      <View className="mb-3">
        <Text className="text-sm font-medium text-foreground mb-2">
          Ingredients
        </Text>
        <TextInput
          placeholder="One ingredient per line..."
          value={data.ingredients || ""}
          onChangeText={(text) => updateField("ingredients", text)}
          multiline
          numberOfLines={4}
          className="min-h-[100px] p-3 rounded-md border border-input bg-background text-foreground"
          textAlignVertical="top"
          placeholderTextColor="#71717a"
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-foreground mb-2">Method</Text>
        <TextInput
          placeholder="Step-by-step instructions..."
          value={data.method || ""}
          onChangeText={(text) => updateField("method", text)}
          multiline
          numberOfLines={6}
          className="min-h-[150px] p-3 rounded-md border border-input bg-background text-foreground"
          textAlignVertical="top"
          placeholderTextColor="#71717a"
        />
      </View>
    </View>
  );
}

interface ProjectFieldsProps {
  data: ProjectTemplateData;
  onChange: (data: ProjectTemplateData) => void;
}

function ProjectFields({ data, onChange }: ProjectFieldsProps) {
  const updateField = (field: keyof ProjectTemplateData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const statusOptions: {
    value: ProjectTemplateData["status"];
    label: string;
    color: string;
  }[] = [
    { value: "planning", label: "Planning", color: "#3b82f6" },
    { value: "active", label: "Active", color: "#22c55e" },
    { value: "on-hold", label: "On Hold", color: "#f59e0b" },
    { value: "completed", label: "Completed", color: "#71717a" },
  ];

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <View className="flex-row items-center gap-2 mb-3">
        <ListOrdered size={16} color="#7c3aed" />
        <Text className="text-sm font-medium text-foreground">
          Project Details
        </Text>
      </View>

      <Text className="text-xs text-muted-foreground mb-2">Status</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {statusOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => updateField("status", option.value!)}
          >
            <Badge
              variant={data.status === option.value ? "default" : "outline"}
              style={{
                backgroundColor:
                  data.status === option.value ? option.color : "transparent",
              }}
            >
              <Text
                className={cn(
                  "text-xs",
                  data.status === option.value
                    ? "text-white"
                    : "text-foreground"
                )}
              >
                {option.label}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>

      <Input
        label="Deadline"
        placeholder="YYYY-MM-DD"
        value={data.deadline || ""}
        onChangeText={(text) => updateField("deadline", text)}
      />
    </View>
  );
}

interface GiftIdeaFieldsProps {
  data: GiftIdeaTemplateData;
  onChange: (data: GiftIdeaTemplateData) => void;
}

function GiftIdeaFields({ data, onChange }: GiftIdeaFieldsProps) {
  const updateField = (field: keyof GiftIdeaTemplateData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const priceRangeOptions = ["$", "$$", "$$$", "$$$$"];
  const occasionOptions = [
    "Birthday",
    "Christmas",
    "Anniversary",
    "Just Because",
    "Other",
  ];

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <View className="flex-row items-center gap-2 mb-3">
        <DollarSign size={16} color="#7c3aed" />
        <Text className="text-sm font-medium text-foreground">
          Gift Idea Details
        </Text>
      </View>

      <Input
        label="Recipient"
        placeholder="Who is this gift for?"
        value={data.recipientName || ""}
        onChangeText={(text) => updateField("recipientName", text)}
        className="mb-3"
      />

      <Text className="text-xs text-muted-foreground mb-2">Price Range</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {priceRangeOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateField("priceRange", option)}
          >
            <Badge variant={data.priceRange === option ? "default" : "outline"}>
              <Text
                className={cn(
                  "text-xs",
                  data.priceRange === option
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {option}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>

      <Text className="text-xs text-muted-foreground mb-2">Occasion</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {occasionOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateField("occasion", option)}
          >
            <Badge variant={data.occasion === option ? "default" : "outline"}>
              <Text
                className={cn(
                  "text-xs",
                  data.occasion === option
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {option}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>

      <Input
        label="Purchase URL"
        placeholder="https://..."
        value={data.purchaseUrl || ""}
        onChangeText={(text) => updateField("purchaseUrl", text)}
        keyboardType="url"
      />
    </View>
  );
}

interface ShoppingItemFieldsProps {
  data: ShoppingItemTemplateData;
  onChange: (data: ShoppingItemTemplateData) => void;
}

function ShoppingItemFields({ data, onChange }: ShoppingItemFieldsProps) {
  const updateField = (
    field: keyof ShoppingItemTemplateData,
    value: string
  ) => {
    onChange({ ...data, [field]: value });
  };

  const unitOptions = [
    "pcs",
    "kg",
    "g",
    "L",
    "ml",
    "pack",
    "bunch",
    "can",
    "bottle",
  ];
  const categoryOptions = [
    "Produce",
    "Dairy",
    "Meat",
    "Bakery",
    "Frozen",
    "Pantry",
    "Beverages",
    "Other",
  ];

  return (
    <View className="bg-card rounded-lg border border-border p-3">
      <View className="flex-row items-center gap-2 mb-3">
        <Package size={16} color="#7c3aed" />
        <Text className="text-sm font-medium text-foreground">
          Shopping Item Details
        </Text>
      </View>

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Input
            label="Quantity"
            placeholder="1"
            value={data.quantity || ""}
            onChangeText={(text) => updateField("quantity", text)}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground mb-2">Unit</Text>
          <View className="flex-row flex-wrap gap-1">
            {unitOptions.slice(0, 4).map((option) => (
              <Pressable
                key={option}
                onPress={() => updateField("unit", option)}
              >
                <Badge variant={data.unit === option ? "default" : "outline"}>
                  <Text
                    className={cn(
                      "text-xs",
                      data.unit === option
                        ? "text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {option}
                  </Text>
                </Badge>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text className="text-xs text-muted-foreground mb-2">Category</Text>
      <View className="flex-row flex-wrap gap-2">
        {categoryOptions.map((option) => (
          <Pressable
            key={option}
            onPress={() => updateField("category", option)}
          >
            <Badge variant={data.category === option ? "default" : "outline"}>
              <Text
                className={cn(
                  "text-xs",
                  data.category === option
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {option}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * Helper to serialize template data to JSON for storage in note body
 */
export function serializeTemplateData(
  templateType: TemplateType,
  data: TemplateData
): string | undefined {
  if (templateType === TemplateType.None || Object.keys(data).length === 0) {
    return undefined;
  }
  return JSON.stringify(data);
}

/**
 * Helper to parse template data from note body JSON
 */
export function parseTemplateData(
  body: string | undefined | null
): TemplateData {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}
