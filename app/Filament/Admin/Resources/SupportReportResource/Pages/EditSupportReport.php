<?php

namespace App\Filament\Admin\Resources\SupportReportResource\Pages;

use App\Enums\SupportReportStatus;
use App\Filament\Admin\Resources\SupportReportResource;
use Filament\Resources\Pages\EditRecord;

class EditSupportReport extends EditRecord
{
    protected static string $resource = SupportReportResource::class;

    /**
     * Stamp who closed a report and when, so the queue keeps its own history
     * without the admin having to fill in two more fields by hand.
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $closed = in_array($data['status'], [
            SupportReportStatus::Resolved->value,
            SupportReportStatus::Closed->value,
        ], true);

        $data['resolved_at'] = $closed
            ? ($this->record->resolved_at ?? now())
            : null;

        if ($closed && blank($data['handled_by'] ?? null)) {
            $data['handled_by'] = auth()->id();
        }

        return $data;
    }

    protected function getRedirectUrl(): ?string
    {
        return $this->getResource()::getUrl('index');
    }
}
