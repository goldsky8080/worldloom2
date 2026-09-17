import { runtime } from '../../app/bootstrap/services';
import { useAtom } from '../../core/state/useAtom';
import { useTranslation } from '../../services/localization';
import { GameCard, CharacterPortrait, StatBar, StatusBadge } from '../../ui/components';
export function CharacterPanel() {
  const characters = useAtom(runtime.cache.characters),
    { t } = useTranslation();
  return (
    <>
      <div className="roster-summary">
        <StatusBadge>
          {t('character.roster', { count: characters.activeRoster.length })}
        </StatusBadge>
        <StatusBadge kind="success">
          {t('character.party', { count: characters.mainParty.length })}
        </StatusBadge>
      </div>
      <h3>
        {t('character.pool')} · {characters.characterPool.length}
      </h3>
      <div className="character-list">
        {characters.characterPool.map((character) => (
          <GameCard key={character.id} className="character-card">
            <CharacterPortrait assetId={character.portraitAssetId} name={character.name} />
            <div>
              <strong>{character.name}</strong>
              <p className="muted">
                {t(character.roleKey)} · {t('common.level', { value: character.level })}
              </p>
              <StatBar value={character.hp} max={character.maxHp} label={t('character.hp')} />
              {characters.mainParty.includes(character.id) && (
                <small className="gold-text">
                  {t('character.party', { count: characters.mainParty.length })}
                </small>
              )}
            </div>
          </GameCard>
        ))}
      </div>
    </>
  );
}
