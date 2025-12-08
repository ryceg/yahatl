namespace Yahatl.Domain.Entities;

/// <summary>
/// Predefined template types that define optional structure for Notes.
/// Templates specify fields, display hints, and behaviour defaults.
/// </summary>
public enum TemplateType
{
    /// <summary>
    /// Plain note with no structured template.
    /// </summary>
    None = 0,

    /// <summary>
    /// Person template: birthday, relationship, google_contact_id.
    /// </summary>
    Person,

    /// <summary>
    /// Recipe template: ingredients, method, prep_time, cook_time, source_url, servings.
    /// </summary>
    Recipe,

    /// <summary>
    /// Project template: status, deadline. Child notes represent steps/tasks.
    /// </summary>
    Project,

    /// <summary>
    /// Gift idea template: recipient (link to Person), price_range, purchase_url, occasion.
    /// </summary>
    GiftIdea,

    /// <summary>
    /// Shopping item template: quantity, unit, category, source_recipe.
    /// </summary>
    ShoppingItem
}
